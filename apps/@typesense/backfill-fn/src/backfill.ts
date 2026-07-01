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

import { firestore } from "firebase-admin";
import type { Client as TypesenseClient } from "typesense";

import { createTypesenseClient } from "~@typesense/client";

const BATCH_SIZE = 100;

export interface CollectionConfig {
  name: string;
  fields: string[];
}

export interface BackfillResult {
  name: string;
  pages: number;
  imported: number;
  failed: number;
}

export interface BackfillSummary {
  collections: BackfillResult[];
  totals: { imported: number; failed: number };
}

type FirestoreDoc = Record<string, unknown>;

// Per-doc result line from Typesense's bulk import.
type ImportEntry = { success: true } | { success: false; error?: string };

// Shape Typesense's client throws when EVERY doc in the bulk fails. The error
// object carries the same per-line results that a success response returns.
interface TypesenseImportError extends Error {
  httpStatus?: number;
  importResults?: ImportEntry[];
}

function buildTypesenseClient(): TypesenseClient {
  // The function ships three separate env vars (TYPESENSE_HOSTS / PORT / PROTOCOL)
  // because that's the contract the upstream extension established and our TF
  // mirrors it. Compose them into a URL so we can use the shared factory from
  // ~@typesense/client — single client construction across the codebase.
  const host = `${process.env["TYPESENSE_PROTOCOL"]}://${process.env["TYPESENSE_HOSTS"]}:${process.env["TYPESENSE_PORT"]}`;
  return createTypesenseClient({
    host,
    apiKey: process.env["TYPESENSE_API_KEY"] ?? "",
    connectionTimeoutSeconds: 60,
  });
}

// Walks a dotted path in the source object and writes the leaf value into the
// output, building any intermediate objects as it goes. Multiple dotted paths
// that share a parent (e.g. metadata.crcFacilities + metadata.crcWorkRelease)
// merge into the same nested object. Missing intermediate keys -> skip
// silently; the field is optional from the projection's perspective.
export function assignNested(
  out: FirestoreDoc,
  src: FirestoreDoc,
  path: string,
): void {
  const parts = path.split(".");
  let cursor: unknown = src;
  for (const p of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") {
      return;
    }
    const obj = cursor as FirestoreDoc;
    if (!(p in obj)) return;
    cursor = obj[p];
  }
  // `cursor` is the leaf value (may legitimately be null).
  let dst = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const existing = dst[k];
    if (
      existing === null ||
      existing === undefined ||
      typeof existing !== "object"
    ) {
      dst[k] = {};
    }
    dst = dst[k] as FirestoreDoc;
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
export function projectFields(
  data: FirestoreDoc,
  fields: string[],
  docId: string,
): FirestoreDoc {
  const out: FirestoreDoc = { id: docId };
  for (const f of fields) {
    if (f.includes(".")) {
      assignNested(out, data, f);
    } else if (f in data) {
      out[f] = data[f];
    }
  }
  return out;
}

// Typesense v1.x's bulk-import response is either a pre-parsed array (modern)
// or an NDJSON string (older). Normalize both shapes into `ImportEntry[]`.
export function parseImportResponse(raw: unknown): ImportEntry[] {
  if (Array.isArray(raw)) return raw as ImportEntry[];
  return String(raw)
    .split("\n")
    .filter(Boolean)
    .map((line): ImportEntry => {
      try {
        return JSON.parse(line) as ImportEntry;
      } catch {
        return {
          success: false,
          error: `unparseable response line: ${line}`,
        };
      }
    });
}

async function backfillCollection(
  client: TypesenseClient,
  { name, fields }: CollectionConfig,
): Promise<BackfillResult> {
  const db = firestore();
  const ref = db.collection(name);

  let imported = 0;
  let failed = 0;
  let pages = 0;
  let cursor: firestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let q = ref.orderBy(firestore.FieldPath.documentId()).limit(BATCH_SIZE);
    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;
    pages += 1;

    const docs = snapshot.docs.map((d) =>
      projectFields(d.data() as FirestoreDoc, fields, d.id),
    );

    try {
      // Typesense bulk import returns per-doc results — a 200 on the request as
      // a whole still has individual `success` booleans per doc.
      const raw = await client
        .collections(name)
        .documents()
        .import(docs, { action: "upsert" });

      const entries = parseImportResponse(raw);

      for (const entry of entries) {
        if (entry.success) {
          imported += 1;
        } else {
          failed += 1;
          console.warn(
            `[${name}] doc import failed: ${entry.error ?? JSON.stringify(entry)}`,
          );
        }
      }
    } catch (err) {
      // Whole-batch failure. The Typesense client throws when EVERY doc in
      // the bulk fails (vs returning per-line successes when some succeed)
      // and tucks the per-doc reasons onto `err.importResults`. Surface a
      // summary of those reasons so Cloud Logging shows why, not just that.
      const importErr = err as TypesenseImportError;
      failed += docs.length;
      console.error(
        `[${name}] batch import threw (size=${docs.length}): ${importErr.message}`,
      );
      if (importErr.httpStatus) {
        console.error(`[${name}] httpStatus=${importErr.httpStatus}`);
      }
      const results = Array.isArray(importErr.importResults)
        ? importErr.importResults
        : null;
      if (results) {
        // Counts by distinct error message — usually one or two unique reasons
        // dominate (a schema-constraint violation hitting every doc the same
        // way), and we get the answer without dumping 100 per-doc lines.
        const errorCounts = new Map<string, number>();
        for (const r of results) {
          if (r && r.success === false) {
            const key = r.error ?? "(no error message)";
            errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
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
          .filter(
            (r): r is { success: false; error?: string } => r.success === false,
          )
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

export async function runBackfill(
  collectionsConfig: CollectionConfig[],
): Promise<BackfillSummary> {
  const client = buildTypesenseClient();
  const results: BackfillResult[] = [];

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
