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

// Orchestration: the scan→project→import→prune loop, and the run that drives it.
//
// For each configured collection:
//   1. Iterate Firestore docs in stable id-ordered pages of batchSize,
//      remembering every id seen (the "should exist" set for this partition).
//   2. Project each doc down to just the configured fields (projection.ts —
//      others dropped before import so Typesense never sees them).
//   3. Bulk-import the batch into Typesense via `documents/import?action=upsert`.
//   4. Parse the per-doc result lines and count successes/failures.
//   5. Prune: after the full scan, take any Typesense doc whose id is NOT in the
//      Firestore id set as a delete CANDIDATE. The ETL deletes records from
//      Firestore, so without this the search index keeps serving rows that no
//      longer exist. Upsert alone never removes anything, so the delete pass is
//      what makes a backfill a true reconcile rather than an additive sync.
//   6. Confirm each candidate with a second Firestore scan, run AFTER the export,
//      and delete only the ones still absent. The id set from step 1 is a
//      snapshot spanning minutes, and the realtime sync extension indexes
//      Firestore writes as they land — so a doc written behind the scan cursor is
//      in the export but not in the snapshot, and looks stale while being live.
//      Only runs when step 5 found candidates.
//
// Steps 5 and 6 live in prune.ts; everything else is here.
//
// Mirrors the upstream extension's backfill loop shape so future maintainers
// can cross-reference (https://github.com/typesense/firestore-typesense-search).

/* eslint-disable no-await-in-loop --
 * Sequential awaits within a single collection are intentional: pages of
 * Firestore docs MUST be fetched serially (each query uses the previous page's
 * last doc as its cursor), and the import for a page can't start until that
 * page is fetched. Collections themselves run concurrently through a bounded
 * worker pool (see runBackfill), so the serial paging costs no wall-clock
 * across collections — only within one.
 */

import { firestore } from "firebase-admin";

import {
  createTypesenseClientFromEnv,
  type FirestoreDoc,
  mergeDocIdFromPath,
  toTypesenseId,
} from "~@typesense/client";

import {
  resolveBatchSize,
  resolveConcurrency,
  resolveImportRatePerSec,
  resolvePruneStale,
} from "./config";
import { projectFields } from "./projection";
import { pruneStaleDocs, scanSourceIds } from "./prune";
import { parseImportResponse } from "./responses";
import { instantiateFromSourceCollection, logTag } from "./scope";
import { createRateLimiter, mapWithConcurrency } from "./throttle";
import type {
  BackfillResult,
  BackfillSummary,
  CollectionConfig,
  MergeSource,
  RunContext,
  TypesenseImportError,
} from "./types";

// A bulk import of thousands of docs can legitimately stall this long.
const CONNECTION_TIMEOUT_SECONDS = 60;

// Held in memory for the duration of the collection's backfill: these are
// user-written updates (tens per day), orders of magnitude smaller than the ETL
// collections they decorate.
async function loadMergeDocuments(
  { db, stateCode }: RunContext,
  { sourceCollection, collectionGroup, fields }: MergeSource,
): Promise<Map<string, FirestoreDoc>> {
  const ref = collectionGroup
    ? db.collectionGroup(sourceCollection)
    : db.collection(sourceCollection);

  // Subcollection update docs don't carry stateCode (only the parent person doc
  // does), so a where() would zero the scan. The composed key is already
  // state-qualified via the record id, so an unfiltered scan stays correct —
  // out-of-state entries simply never match a target doc.
  const snapshot = await ref.get();

  const byId = new Map<string, FirestoreDoc>();
  for (const doc of snapshot.docs) {
    const id = mergeDocIdFromPath(doc.ref.path);
    if (stateCode && !id.startsWith(`${stateCode.toLowerCase()}_`)) continue;
    const data = doc.data() as FirestoreDoc;
    const picked: FirestoreDoc = {};
    for (const field of fields) {
      if (field in data) picked[field] = data[field];
    }
    byId.set(id, picked);
  }
  return byId;
}

async function backfillCollection(
  ctx: RunContext,
  {
    name,
    sourceCollection,
    fields,
    constantFields,
    derivedFields,
    docIdOverrides,
    mergeSources,
  }: CollectionConfig,
): Promise<BackfillResult> {
  const { db, client, limiter, batchSize, prune, stateCode } = ctx;
  const source = sourceCollection ?? name;
  const ref = db.collection(source);
  // When scoped to a single state, filter the scan to that state. Relies on the
  // ETL validating `stateCode` on every document it writes — a document without
  // it is silently excluded here and never indexed. The prune reads the same
  // partition (constantFields + stateCode), so the two stay in sync.
  const base = stateCode ? ref.where("stateCode", "==", stateCode) : ref;
  const tag = logTag(name, stateCode);

  // Merge docs never create Typesense documents on their own — they only
  // decorate ETL-sourced ones — so an update whose opportunity has dropped out
  // of the ETL is simply not applied, and the prune below removes the stale
  // document as usual.
  const mergeDocs = new Map<string, FirestoreDoc>();
  for (const mergeSource of mergeSources ?? []) {
    const loaded = await loadMergeDocuments(ctx, mergeSource);
    for (const [id, data] of loaded) {
      mergeDocs.set(id, { ...mergeDocs.get(id), ...data });
    }
  }
  if (mergeSources?.length) {
    console.info(`${tag} merge: loaded ${mergeDocs.size} update doc(s)`);
  }

  let imported = 0;
  let failed = 0;
  let pages = 0;
  let cursor: firestore.QueryDocumentSnapshot | null = null;
  // Every Firestore id seen across all pages — the set of docs that SHOULD exist
  // in Typesense (within scope). Drives the prune pass.
  const firestoreIds = new Set<string>();

  while (true) {
    let q = base.orderBy(firestore.FieldPath.documentId()).limit(batchSize);
    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;
    pages += 1;

    const docs = snapshot.docs.map((d) => {
      const data = d.data() as FirestoreDoc;
      const id = toTypesenseId(d.id, data, docIdOverrides);
      firestoreIds.add(id);

      const projected = projectFields(
        data,
        fields,
        id,
        constantFields,
        derivedFields,
      );

      // Merged fields win over the ETL projection: the officer's action is the
      // newer truth for the fields it owns.
      const merged = mergeDocs.get(id);
      // `id` re-applied last so a stray merge field can't clobber it, matching
      // projectFields' own protection.
      return merged ? { ...projected, ...merged, id } : projected;
    });

    try {
      // Gate every import through the shared limiter so the combined request
      // rate across all concurrent collections doesn't overwhelm the shared
      // Typesense cluster (which also serves live search). No-op when disabled.
      await limiter.take();

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
            `${tag} doc import failed: ${entry.error ?? JSON.stringify(entry)}`,
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
        `${tag} batch import threw (size=${docs.length}): ${importErr.message}`,
      );
      if (importErr.httpStatus) {
        console.error(`${tag} httpStatus=${importErr.httpStatus}`);
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
          `${tag} distinct error messages: ${[...errorCounts.entries()]
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
          console.error(`${tag} sample failure: ${JSON.stringify(r)}`);
        }
      }
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < batchSize) break;
  }

  // The full Firestore scan completed without throwing, so `firestoreIds` is
  // complete as of the moment it was taken. It can still be STALE by now, so the
  // prune re-confirms each delete candidate through `confirmIds` rather than
  // trusting the snapshot outright. The thunk is lazy — a run with no stale
  // candidates never pays for the second scan.
  const deleted = prune
    ? await pruneStaleDocs(ctx, {
        name,
        firestoreIds,
        constantFields,
        confirmIds: () => scanSourceIds(ctx, base, docIdOverrides),
      })
    : 0;

  console.info(
    `${tag} done — pages=${pages} imported=${imported} failed=${failed} deleted=${deleted}`,
  );
  return { name, pages, imported, failed, deleted };
}

export async function runBackfill(
  collectionsConfig: CollectionConfig[],
  stateCode?: string,
  sourceCollection?: string,
): Promise<BackfillSummary> {
  // A bare `{ collections: ["opportunities"] }` invocation (no
  // sourceCollection) falls through to backfillCollection using `name` as the
  // Firestore source — an empty scan of the non-existent top-level
  // `opportunities` collection. The empty-scan safety valve in the prune
  // prevents any deletion, so the response is `{ imported: 0, deleted: 0 }`.
  const instantiated = instantiateFromSourceCollection(
    collectionsConfig,
    sourceCollection,
  );

  const inScope = stateCode
    ? instantiated.filter(
        (c) =>
          !c.constantFields?.["stateCode"] ||
          c.constantFields["stateCode"] === stateCode,
      )
    : instantiated;

  // Every knob is read here, once, so nothing shifts under a run in progress.
  // See RunContext for why the limiter must be a single shared instance.
  const ctx: RunContext = {
    db: firestore(),
    client: createTypesenseClientFromEnv(CONNECTION_TIMEOUT_SECONDS),
    limiter: createRateLimiter(resolveImportRatePerSec()),
    batchSize: resolveBatchSize(),
    prune: resolvePruneStale(),
    stateCode,
  };

  // Process collections through a bounded worker pool rather than one-at-a-time,
  // overlapping the slow tail of large collections against the rest.
  const results = await mapWithConcurrency(
    inScope,
    resolveConcurrency(),
    (config) => backfillCollection(ctx, config),
  );

  const totals = results.reduce(
    (acc, r) => ({
      imported: acc.imported + r.imported,
      failed: acc.failed + r.failed,
      deleted: acc.deleted + r.deleted,
    }),
    { imported: 0, failed: 0, deleted: 0 },
  );

  return { collections: results, totals };
}
