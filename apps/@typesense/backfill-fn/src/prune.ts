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

// The only code in this app that DELETES anything, which is why it lives alone.
// Upsert never removes a document, so without the prune the index keeps serving
// records the ETL already deleted from Firestore — and this is the one place
// where a logic error destroys data rather than producing a stale index.
//
// Every guard below fails CLOSED, in order:
//
//   1. Empty Firestore scan   → refuse (a 0-doc scan would mark everything stale)
//   2. Export request failed  → skip (no evidence of what exists)
//   3. Nothing looks stale    → return early, no second scan
//   4. Confirming scan failed → skip (candidates unverified)
//   5. Candidate reappeared   → keep it
//
// "0 deleted" is always recoverable; deleting on a guess is not.

/* eslint-disable no-await-in-loop --
 * Both loops here must be serial. scanSourceIds pages Firestore with a cursor,
 * so page N+1's query needs page N's last document. The delete loop awaits the
 * shared limiter per document on purpose — that is what bounds the combined
 * write rate against a cluster that is also serving live search.
 */

import { firestore } from "firebase-admin";

import { toTypesenseId } from "./docIds";
import { selectStaleIds } from "./responses";
import { buildPruneFilter, logTag } from "./scope";
import type { CollectionConfig, FirestoreDoc, RunContext } from "./types";

// Pages a Firestore partition and returns the set of Typesense ids it derives.
// No projection, no import, no merge — just the ids. Uses the same query shape
// as the import loop in backfillCollection (id-ordered pages, startAfter cursor)
// so the two agree on what the partition contains.
//
// `select()` trims the payload to what the id derivation actually reads. For a
// field-composed id that means the id FIELDS themselves: a bare `select()` here
// would return docs with empty data, composeDocIdFromFields would return
// undefined for every one, and the whole set would collapse to Firestore doc ids
// that match nothing — silently confirming nothing. Every other shape takes the
// id from the doc ref, so it needs no fields at all.
export async function scanSourceIds(
  { batchSize }: RunContext,
  base: firestore.Query,
  docIdOverrides: CollectionConfig["docIdOverrides"],
): Promise<Set<string>> {
  const projected =
    docIdOverrides?.type === "fields"
      ? base.select(...docIdOverrides.fields)
      : base.select();

  const ids = new Set<string>();
  let cursor: firestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let q = projected
      .orderBy(firestore.FieldPath.documentId())
      .limit(batchSize);
    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;

    for (const d of snapshot.docs) {
      ids.add(toTypesenseId(d.id, d.data() as FirestoreDoc, docIdOverrides));
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < batchSize) break;
  }

  return ids;
}

/** The one partition being reconciled, as opposed to the run-wide RunContext. */
export type PruneTarget = {
  name: string;
  firestoreIds: Set<string>;
  constantFields?: Record<string, string>;
  /**
   * Re-derives the partition's Firestore id set, to confirm delete candidates
   * against. Called only when the diff produced candidates, and only AFTER the
   * Typesense export — see the ordering note at the call site.
   */
  confirmIds: () => Promise<Set<string>>;
};

// Reconciles Typesense against Firestore: deletes every in-scope doc whose id is
// NOT in `firestoreIds` AND is still absent on a second look (see the confirming
// scan below). Scope is the whole collection, or a single state when
// `ctx.stateCode` is set — in which case BOTH the Firestore scan (upstream) and
// the Typesense export below are filtered to that state, so cross-state docs are
// never delete candidates. Called only after backfillCollection has paged the
// entire in-scope set without error, so `firestoreIds` is complete for the moment
// it was taken — a mid-scan Firestore read failure throws out of
// backfillCollection before we ever get here, so we can never prune against a
// partial set.
export async function pruneStaleDocs(
  ctx: RunContext,
  { name, firestoreIds, constantFields, confirmIds }: PruneTarget,
): Promise<number> {
  const { client, limiter, stateCode } = ctx;
  const scope = stateCode ? `state ${stateCode}` : "collection";
  const tag = logTag(name, stateCode);
  const filterBy = buildPruneFilter(constantFields, stateCode);

  // Safety valve: an empty Firestore scan would mark EVERY in-scope Typesense
  // doc stale. That almost always means a misconfiguration or an ETL that hasn't
  // populated the scope — not a legitimate "empty it" — so refuse and warn
  // loudly rather than silently wiping a live collection (or a live state).
  if (firestoreIds.size === 0) {
    console.warn(
      `${tag} prune skipped: Firestore scan returned 0 docs (refusing to delete the entire ${scope})`,
    );
    return 0;
  }

  await limiter.take();
  let exported: string;
  try {
    exported = await client
      .collections(name)
      .documents()
      .export(
        filterBy
          ? { include_fields: "id", filter_by: filterBy }
          : { include_fields: "id" },
      );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`${tag} prune skipped: could not export ids (${message})`);
    return 0;
  }

  const staleIds = selectStaleIds(exported, firestoreIds);
  if (staleIds.length === 0) {
    console.info(`${tag} prune: no stale docs`);
    return 0;
  }

  // `firestoreIds` is a SNAPSHOT, taken across a scan that runs for minutes on a
  // large collection — and the realtime sync extension indexes Firestore writes
  // as they land. So a doc the ETL wrote behind the scan cursor is in the export
  // above but absent from the snapshot, and looks stale when it is in fact live.
  // Re-derive the id set now and keep only candidates still absent from it.
  //
  // The ordering is the whole point: the confirming scan must run AFTER the
  // export, because the failure mode is "the export saw a doc the scan missed".
  // A confirming scan taken BEFORE the export would leave the same window open.
  let confirmed: Set<string>;
  try {
    confirmed = await confirmIds();
  } catch (err) {
    // Never fall through to deleting an unconfirmed list. 0 deleted is always
    // safe — the next run reconciles.
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `${tag} prune skipped: could not confirm ${staleIds.length} candidate(s) (${message})`,
    );
    return 0;
  }

  const stillStale = staleIds.filter((id) => !confirmed.has(id));
  console.info(
    `${tag} prune: ${staleIds.length} candidate(s), ${stillStale.length} confirmed stale, ${staleIds.length - stillStale.length} still present in Firestore`,
  );
  // A persistently non-zero "still present" count means the ETL writes while
  // backfills run — which is exactly what this guard absorbs.
  if (stillStale.length === 0) return 0;

  let deleted = 0;
  for (const id of stillStale) {
    // Gate deletes through the same limiter as imports so the combined write
    // rate against the shared cluster stays bounded.
    await limiter.take();
    try {
      await client.collections(name).documents(id).delete();
      deleted += 1;
    } catch (err) {
      // 404 = the doc is already gone (e.g. the extension's realtime delete
      // trigger raced us). That's the desired end state, so don't count it as
      // a failure — just move on.
      const httpStatus = (err as { httpStatus?: number }).httpStatus;
      if (httpStatus === 404) continue;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`${tag} failed to delete stale doc ${id}: ${message}`);
    }
  }

  console.info(`${tag} prune: deleted ${deleted}/${stillStale.length}`);
  return deleted;
}
