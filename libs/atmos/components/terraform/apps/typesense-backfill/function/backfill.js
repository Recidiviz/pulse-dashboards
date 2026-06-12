// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

// Core backfill logic.
//
// For each configured collection:
//   1. Iterate Firestore docs in stable id-ordered pages of BATCH_SIZE.
//   2. Project each doc down to just the configured fields (others dropped
//      before import so Typesense never sees them).
//   3. Bulk-import the batch into Typesense via `documents/import?action=upsert`.
//   4. Parse the per-doc result lines and count successes/failures.
//
// Mirrors the upstream extension's backfill loop shape so future maintainers
// can cross-reference (https://github.com/typesense/firestore-typesense-search).

/* eslint-disable no-await-in-loop --
 * Sequential awaits are intentional throughout this file. Pages of Firestore
 * docs MUST be fetched serially (each query uses the previous page's last doc
 * as its cursor), and concurrent Typesense imports would blow past the cluster
 * IP-rate-limit (600/min) on large collections.
 */

const admin = require("firebase-admin");
const Typesense = require("typesense");

const BATCH_SIZE = 100;

function buildTypesenseClient() {
  return new Typesense.Client({
    nodes: [
      {
        host: process.env.TYPESENSE_HOSTS,
        port: Number.parseInt(process.env.TYPESENSE_PORT, 10),
        protocol: process.env.TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 60,
  });
}

// Walks a dotted path in the source object and writes the leaf value into the
// output, building any intermediate objects as it goes. Multiple dotted paths
// that share a parent (e.g. metadata.crcFacilities + metadata.crcWorkRelease)
// merge into the same nested object. Missing intermediate keys -> skip
// silently; the field is optional from the projection's perspective.
function assignNested(out, src, path) {
  const parts = path.split(".");
  let cursor = src;
  for (const p of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") {
      return;
    }
    if (!(p in cursor)) return;
    cursor = cursor[p];
  }
  // `cursor` is the leaf value (may legitimately be null).
  let dst = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!(k in dst) || typeof dst[k] !== "object" || dst[k] === null) {
      dst[k] = {};
    }
    dst = dst[k];
  }
  dst[parts[parts.length - 1]] = cursor;
}

// Projects each declared field from the source Firestore document into the
// import payload. Top-level field names map straight across; dotted names like
// `personName.givenNames` walk into the source's nested structure and
// reconstruct only the declared leaves on the way out. This lets us declare
// specific nested children in the schema without shipping their entire parent
// object — important for residents where `metadata` is large but we only
// index one sub-field.
function projectFields(data, fields, docId) {
  const out = { id: docId };
  for (const f of fields) {
    if (f.includes(".")) {
      assignNested(out, data, f);
    } else if (f in data) {
      out[f] = data[f];
    }
  }
  return out;
}

async function backfillCollection(client, { name, fields }) {
  const db = admin.firestore();
  const ref = db.collection(name);

  let imported = 0;
  let failed = 0;
  let pages = 0;
  let cursor = null;

  while (true) {
    let q = ref
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);
    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;
    pages += 1;

    const docs = snapshot.docs.map((d) =>
      projectFields(d.data(), fields, d.id),
    );

    try {
      // Typesense bulk import returns per-doc results — a 200 on the request as
      // a whole still has individual `success` booleans per doc. Modern client
      // versions (1.x+) return a pre-parsed array; older versions returned an
      // NDJSON string. Normalize both shapes here.
      const raw = await client
        .collections(name)
        .documents()
        .import(docs, { action: "upsert" });

      const entries = Array.isArray(raw)
        ? raw
        : String(raw)
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch {
                return {
                  success: false,
                  error: `unparseable response line: ${line}`,
                };
              }
            });

      for (const entry of entries) {
        if (entry.success) imported += 1;
        else {
          failed += 1;
          console.warn(
            `[${name}] doc import failed: ${entry.error || JSON.stringify(entry)}`,
          );
        }
      }
    } catch (err) {
      // Whole-batch failure. The Typesense client throws when EVERY doc in
      // the bulk fails (vs returning per-line successes when some succeed)
      // and tucks the per-doc reasons onto `err.importResults`. Surface a
      // summary of those reasons so Cloud Logging shows why, not just that.
      failed += docs.length;
      console.error(
        `[${name}] batch import threw (size=${docs.length}): ${err.message}`,
      );
      if (err.httpStatus) {
        console.error(`[${name}] httpStatus=${err.httpStatus}`);
      }
      const results = Array.isArray(err.importResults)
        ? err.importResults
        : null;
      if (results) {
        // Counts by distinct error message — usually one or two unique reasons
        // dominate (a schema-constraint violation hitting every doc the same
        // way), and we get the answer without dumping 100 per-doc lines.
        const errorCounts = new Map();
        for (const r of results) {
          if (r && r.success === false) {
            const key = r.error || "(no error message)";
            errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
          }
        }
        console.error(
          `[${name}] distinct error messages: ${[...errorCounts.entries()]
            .map(([msg, count]) => `${count}× "${msg}"`)
            .join("; ")}`,
        );
        // First 3 failed entries with their projected docs — for when the
        // counts alone don't pin it down (multiple distinct errors).
        const samples = results
          .filter((r) => r && r.success === false)
          .slice(0, 3);
        for (const r of samples) {
          console.error(`[${name}] sample failure: ${JSON.stringify(r)}`);
        }
      }
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < BATCH_SIZE) break;
  }

  console.info(
    `[${name}] done — pages=${pages} imported=${imported} failed=${failed}`,
  );
  return { name, pages, imported, failed };
}

async function runBackfill(collectionsConfig) {
  const client = buildTypesenseClient();
  const results = [];

  // Sequential, not parallel — concurrent imports would blow past Typesense's
  // per-IP rate limit (600/min) on large collections, and Cloud Armor would
  // start denying with 429s.
  for (const config of collectionsConfig) {
    const r = await backfillCollection(client, config);
    results.push(r);
  }

  const totals = results.reduce(
    (acc, r) => ({
      imported: acc.imported + r.imported,
      failed: acc.failed + r.failed,
    }),
    { imported: 0, failed: 0 },
  );

  return { collections: results, totals };
}

module.exports = { runBackfill };
