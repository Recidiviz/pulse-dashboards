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
import { pruneStaleDocs, scanSourceIds } from "./prune";
import { instantiateFromSourceCollection, logTag } from "./scope";
import { createRateLimiter, mapWithConcurrency } from "./throttle";
import { resolveTransform } from "./transforms";
import type {
  BackfillResult,
  BackfillSummary,
  CollectionConfig,
  MergeSet,
  MergeSource,
  RunContext,
} from "./types";
import { importBatch, projectWithMerges } from "./utils";

// A bulk import of thousands of docs can legitimately stall this long.
const CONNECTION_TIMEOUT_SECONDS = 60;

// Two things bound this scan:
//
//   - `select()` fetches ONLY the picked fields. Also a privacy boundary: what
//     is read here is what can reach the index.
//   - `hasStateCode` pushes a state-scoped run's filter into Firestore.
async function loadMergeDocuments(
  { db, stateCode }: RunContext,
  { sourceCollection, collectionGroup, fields, hasStateCode }: MergeSource,
): Promise<Map<string, FirestoreDoc>> {
  const ref = collectionGroup
    ? db.collectionGroup(sourceCollection)
    : db.collection(sourceCollection);

  // Only the source-reading forms name a field to fetch; a literal needs none.
  const sourceFields = fields.flatMap((field) => {
    if (typeof field === "string") return [field];
    return "from" in field ? [field.from] : [];
  });

  // Both cases, because the two sources disagree. The ETL writes `US_TN` on an
  // opportunity update; `clientUpdatesV2` carries `recordId.slice(0, 5)`, which
  // is lowercase. Asking for one would silently drop the other's documents.
  const scoped =
    hasStateCode && stateCode
      ? ref.where("stateCode", "in", [stateCode, stateCode.toLowerCase()])
      : ref;
  // An empty select() fetches id-only documents, which is right when every
  // field is a literal.
  const snapshot = await scoped.select(...sourceFields).get();

  const byId = new Map<string, FirestoreDoc>();
  for (const doc of snapshot.docs) {
    const id = mergeDocIdFromPath(doc.ref.path);
    if (stateCode && !id.startsWith(`${stateCode.toLowerCase()}_`)) continue;
    const data = doc.data() as FirestoreDoc;
    const picked: FirestoreDoc = {};
    for (const field of fields) {
      if (typeof field === "string") {
        if (field in data) picked[field] = data[field];
      } else if ("value" in field) {
        picked[field.into] = field.value;
      } else if (field.from in data) {
        picked[field.into] = data[field.from];
      }
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
    referenceFields,
    transform,
    collectionGroup,
    mergeSources,
  }: CollectionConfig,
): Promise<BackfillResult> {
  const { db, batchSize, prune, stateCode } = ctx;
  // Resolved once, and eagerly: an unknown name must stop the run here rather
  // than import every document without its derived fields.
  const resolvedTransform = transform ? resolveTransform(transform) : undefined;
  const source = sourceCollection ?? name;
  // A subcollection has no single root collection to page through, so it is
  // scanned as a group. No index required; see CollectionConfig.
  const ref: firestore.Query = collectionGroup
    ? db.collectionGroup(source)
    : db.collection(source);
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
  //
  // Kept PER SOURCE rather than flattened into one map: sources disagree on how
  // a target finds its merge doc, and the two key shapes would be
  // indistinguishable once mixed.
  const mergeSets: MergeSet[] = [];
  for (const mergeSource of mergeSources ?? []) {
    // Serial on purpose, per the file-level no-await-in-loop note: each source
    // is a full collection scan held in memory, so running them concurrently
    // would multiply peak memory rather than save wall-clock.
    const docs = await loadMergeDocuments(ctx, mergeSource);
    mergeSets.push({ source: mergeSource, docs });
    console.info(
      `${tag} merge: loaded ${docs.size} doc(s) from ${mergeSource.sourceCollection}`,
    );
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
      const id = toTypesenseId(d.id, data, docIdOverrides, d.ref.path);
      firestoreIds.add(id);
      return projectWithMerges(
        data,
        id,
        {
          fields,
          constantFields,
          derivedFields,
          referenceFields,
          transform: resolvedTransform,
        },
        mergeSets,
      );
    });

    const batch = await importBatch(ctx, name, docs, tag);
    imported += batch.imported;
    failed += batch.failed;

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
  system?: string,
): Promise<BackfillSummary> {
  // A bare `{ collections: ["opportunities"] }` invocation (no
  // sourceCollection) falls through to backfillCollection using `name` as the
  // Firestore source — an empty scan of the non-existent top-level
  // `opportunities` collection. The empty-scan safety valve in the prune
  // prevents any deletion, so the response is `{ imported: 0, deleted: 0 }`.
  const instantiated = instantiateFromSourceCollection(
    collectionsConfig,
    sourceCollection,
    system,
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
