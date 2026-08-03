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
//   1. Iterate Firestore docs in stable id-ordered pages of BATCH_SIZE,
//      remembering every id seen (the authoritative "should exist" set).
//   2. Project each doc down to just the configured fields (others dropped
//      before import so Typesense never sees them).
//   3. Bulk-import the batch into Typesense via `documents/import?action=upsert`.
//   4. Parse the per-doc result lines and count successes/failures.
//   5. Prune: after the full scan, delete any Typesense doc whose id is NOT in
//      the Firestore id set. The ETL deletes records from Firestore, so without
//      this the search index keeps serving rows that no longer exist. Upsert
//      alone never removes anything, so the delete pass is what makes a backfill
//      a true reconcile rather than an additive sync.
//
// Mirrors the upstream extension's backfill loop shape so future maintainers
// can cross-reference (https://github.com/typesense/firestore-typesense-search).

/* eslint-disable no-await-in-loop --
 * Sequential awaits within a single collection are intentional: pages of
 * Firestore docs MUST be fetched serially (each query uses the previous page's
 * last doc as its cursor), and the import for a page can't start until that
 * page is fetched. Collections themselves run concurrently through a bounded
 * worker pool (see runBackfill) — the pool size, not per-collection paging, is
 * what keeps total in-flight imports under the cluster's IP rate limit
 * (600/min).
 */

import { firestore } from "firebase-admin";
import type { Client as TypesenseClient } from "typesense";

import { createTypesenseClient } from "~@typesense/client";

// Firestore page size = Typesense import batch size. Larger batches mean fewer
// serial fetch→import round trips per collection (pagination is strictly serial
// within a collection, so for big collections like `clients` the round-trip
// count dominates wall-clock). Typesense bulk import handles thousands of docs
// per request; 500 is a safe default well within the function's memory. Override
// via env.
const DEFAULT_BATCH_SIZE = 500;

export function resolveBatchSize(): number {
  const raw = Number(process.env["BACKFILL_BATCH_SIZE"]);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_BATCH_SIZE;
}

// How many collections to backfill concurrently. Each collection pages its
// Firestore reads — and therefore its Typesense imports — serially, so this caps
// how many import streams overlap. Concurrency is what lets a large collection's
// slow tail overlap the others; it is NOT what keeps us under the rate limit —
// that's the limiter below (concurrency bounds in-flight requests, not their
// rate). Override via env.
const DEFAULT_CONCURRENCY = 3;

export function resolveConcurrency(): number {
  const raw = Number(process.env["BACKFILL_CONCURRENCY"]);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_CONCURRENCY;
}

// Global cap on the rate of Typesense import requests across ALL concurrently
// running collections. Originally added to stay under Cloud Armor's per-IP limit
// (600/min); now that the function's static egress IP is allowlisted past Cloud
// Armor, its job is to protect the SHARED Typesense cluster — the same nodes
// answer live search, so an unbounded write flood would spike search latency and
// pending writes. Set BACKFILL_IMPORT_RATE_PER_SEC=0 to disable limiting entirely
// (e.g. a staging run with no live traffic); any positive value caps requests/sec.
const DEFAULT_IMPORT_RATE_PER_SEC = 50;

export function resolveImportRatePerSec(): number {
  const raw = process.env["BACKFILL_IMPORT_RATE_PER_SEC"];
  // Distinguish "unset" (→ default) from an explicit "0" (→ disabled). A negative
  // or non-numeric value is treated as a mistake and falls back to the default.
  if (raw === undefined || raw.trim() === "")
    return DEFAULT_IMPORT_RATE_PER_SEC;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_IMPORT_RATE_PER_SEC;
}

// Whether the backfill deletes Typesense docs whose ids are no longer in the
// Firestore source (see step 5 in the file header). ON by default — parity with
// the ETL's Firestore deletes is the whole point. Set BACKFILL_PRUNE_STALE=false
// to run an import-only pass (e.g. to isolate an import problem, or seed a fresh
// collection before the source is fully populated) without the destructive
// delete phase. Only the literal "false" (case-insensitive) disables it; any
// other value — including unset — leaves pruning on.
export function resolvePruneStale(): boolean {
  const raw = process.env["BACKFILL_PRUNE_STALE"];
  if (raw === undefined) return true;
  return raw.trim().toLowerCase() !== "false";
}

export interface RateLimiter {
  take(): Promise<void>;
}

// Minimum-interval limiter: hands out permits no closer together than
// `1000 / ratePerSec` ms. Each caller synchronously reserves the next slot
// (advancing `nextAllowedAt`) before awaiting, so concurrent callers queue
// fairly FIFO and spread out rather than all firing at once. Deliberately a
// smooth limiter, not a burst bucket — it protects a sustained write rate.
// A non-positive (or non-finite) rate disables limiting entirely: take()
// resolves immediately, imports run as fast as the cluster will accept them.
// `now`/`sleep` are injectable so the spacing is deterministically testable.
export function createRateLimiter(
  ratePerSec: number,
  now: () => number = Date.now,
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
): RateLimiter {
  // Disabled (BACKFILL_IMPORT_RATE_PER_SEC=0): hand out permits with no spacing.
  if (!Number.isFinite(ratePerSec) || ratePerSec <= 0) {
    return { take: () => Promise.resolve() };
  }

  const minIntervalMs = 1000 / ratePerSec;
  let nextAllowedAt = 0;

  return {
    async take(): Promise<void> {
      const scheduledAt = Math.max(now(), nextAllowedAt);
      // Reserve this slot synchronously so a concurrent caller chains off it.
      nextAllowedAt = scheduledAt + minIntervalMs;
      const waitMs = scheduledAt - now();
      if (waitMs > 0) await sleep(waitMs);
    },
  };
}

// Runs `task` over `items` with at most `concurrency` invocations in flight at
// once, returning results in INPUT order regardless of completion order. A
// small hand-rolled worker pool (no extra deps): each worker pulls the next
// index until the queue drains. `concurrency` is clamped to [1, items.length]
// so an empty list spawns no real work and an oversized limit can't exceed the
// number of items.
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let next = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) break;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

export interface CollectionConfig {
  name: string;
  fields: string[];
  /**
   * Constants stamped onto every emitted doc from this source AFTER the
   * source-field projection (so a constant with the same key as a source
   * field wins). Used to inject discriminators — currently `system` on the
   * caseload/person collections that either don't exist on
   * the source doc or should be canonicalized. `id` is protected; a
   * `constantFields.id` entry cannot clobber the docId.
   */
  constantFields?: Record<string, string>;
  /**
   * Per-doc derivations. Two variants, both discriminated by their key set:
   *
   * 1. **Value-map**: read `data[from]`, look it up in `valueMapping`, stamp
   *    the mapped value into `into`. Used for `locations.system` derived
   *    from `idType`. Source values not in `valueMapping` leave the target
   *    unset (under-permissive default).
   * 2. **Conditional copy**: if `data[when.field] === when.equals`, copy the
   *    value of `data[copyFrom]` into `into`. Used for `locations.district`
   *    on district-idType docs, where the district name already lives in
   *    `locationId` and just needs to be surfaced under the `district` key
   *    the byDistricts filter references.
   *
   * Applied BEFORE `constantFields` so an explicit constant still wins on
   * key collision. `id` is protected regardless — always set from `docId`
   * last, so neither variant can clobber it.
   */
  derivedFields?: Array<
    | { from: string; into: string; valueMapping: Record<string, string> }
    | {
        copyFrom: string;
        into: string;
        when: { field: string; equals: string };
      }
  >;
}

export interface BackfillResult {
  name: string;
  pages: number;
  imported: number;
  failed: number;
  // Stale Typesense docs deleted because their id was absent from Firestore.
  deleted: number;
}

export interface BackfillSummary {
  collections: BackfillResult[];
  totals: { imported: number; failed: number; deleted: number };
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
//
// Order matters:
//   1. Project source fields.
//   2. Apply `derivedFields` — read a source field, map through a lookup,
//      stamp the result into a target field (e.g. `locations.idType` →
//      `system`). Unmapped source values leave the target unset.
//   3. Apply `constantFields` — merges LAST so a constant wins against a
//      colliding source or derived value. Whole point of the mechanism is to
//      stamp a canonical value (e.g. `system: "SUPERVISION"`) regardless of
//      what came from the source doc.
//   4. Set `id` from `docId` — protected against any `constantFields.id` or
//      `derivedFields.into: "id"` attempt.
export function projectFields(
  data: FirestoreDoc,
  fields: string[],
  docId: string,
  constantFields?: Record<string, string>,
  derivedFields?: CollectionConfig["derivedFields"],
): FirestoreDoc {
  const out: FirestoreDoc = {};
  for (const f of fields) {
    if (f.includes(".")) {
      assignNested(out, data, f);
    } else if (f in data) {
      out[f] = data[f];
    }
  }
  if (derivedFields) {
    for (const rule of derivedFields) {
      if ("valueMapping" in rule) {
        const raw = data[rule.from];
        if (typeof raw === "string" && raw in rule.valueMapping) {
          out[rule.into] = rule.valueMapping[raw];
        }
      } else {
        // Conditional copy: only stamp when the guard field matches.
        const guard = data[rule.when.field];
        if (guard === rule.when.equals) {
          const value = data[rule.copyFrom];
          if (typeof value === "string") {
            out[rule.into] = value;
          }
        }
      }
    }
  }
  if (constantFields) {
    Object.assign(out, constantFields);
  }
  out["id"] = docId;
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

// The Recidiviz state-code shape: `US_` followed by exactly two
// uppercase ASCII letters (US_AZ, US_ID, ...). We validate the SHAPE rather than
// membership in ~auth-utils' `stateCodes` because the ETL trigger fires per
// state as data lands, including states not yet enrolled in a dashboard product
// (so absent from `stateCodes`). Gating on that list would 400 those legitimate
// backfills; the ETL is the authority on which states have data.
const STATE_CODE_PATTERN = /^US_[A-Z]{2}$/;

export function isValidStateCode(raw: unknown): raw is string {
  return typeof raw === "string" && STATE_CODE_PATTERN.test(raw);
}

// Given a Typesense id-only export (JSONL, one `{"id":"..."}` per line) and the
// set of ids that Firestore says should exist, returns the ids present in
// Typesense but NOT in Firestore — the docs to delete. Lines that are blank,
// unparseable, or missing a string `id` are skipped rather than aborting the
// diff. Pure and deterministic so the prune decision is unit-testable without a
// live cluster.
export function selectStaleIds(
  exportedJsonl: string,
  keepIds: Set<string>,
): string[] {
  const stale: string[] = [];
  for (const line of exportedJsonl.split("\n")) {
    if (!line) continue;
    try {
      const { id } = JSON.parse(line) as { id?: unknown };
      if (typeof id === "string" && !keepIds.has(id)) stale.push(id);
    } catch {
      // Ignore an unparseable export line rather than abort the whole prune.
    }
  }
  return stale;
}

// Log tag for a collection, optionally scoped to a state: `[clients]` for a
// whole-collection run, `[clients, US_ID]` when scoped — so every log line is
// attributable to the exact (collection, state) partition it came from.
function logTag(name: string, stateCode?: string): string {
  const suffix = stateCode ? `, ${stateCode}` : "";
  return `[${name}${suffix}]`;
}

// Reconciles Typesense against Firestore: deletes every in-scope doc whose id is
// NOT in `firestoreIds`. Scope is the whole collection, or a single state when
// `stateCode` is set — in which case BOTH the Firestore scan (upstream) and the
// Typesense export below are filtered to that state, so cross-state docs are
// never delete candidates. Called only after backfillCollection has paged the
// entire in-scope set without error, so `firestoreIds` is guaranteed complete —
// a mid-scan Firestore read failure throws out of backfillCollection before we
// ever get here, so we can never prune against a partial set.
async function pruneStaleDocs(
  client: TypesenseClient,
  name: string,
  firestoreIds: Set<string>,
  limiter: RateLimiter,
  stateCode?: string,
): Promise<number> {
  const scope = stateCode ? `state ${stateCode}` : "collection";
  const tag = logTag(name, stateCode);

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

  // Pull just the ids currently in Typesense, scoped to the same state as the
  // scan so cross-state docs can't be delete candidates. export() streams the
  // matching docs as JSONL; include_fields=id keeps each line tiny.
  await limiter.take();
  let exported: string;
  try {
    exported = await client
      .collections(name)
      .documents()
      .export(
        stateCode
          ? { include_fields: "id", filter_by: `stateCode:=${stateCode}` }
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

  console.info(`${tag} prune: deleting ${staleIds.length} stale doc(s)`);

  let deleted = 0;
  for (const id of staleIds) {
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

  console.info(`${tag} prune: deleted ${deleted}/${staleIds.length}`);
  return deleted;
}

async function backfillCollection(
  client: TypesenseClient,
  { name, fields, constantFields, derivedFields }: CollectionConfig,
  limiter: RateLimiter,
  batchSize: number,
  prune: boolean,
  stateCode?: string,
): Promise<BackfillResult> {
  const db = firestore();
  const ref = db.collection(name);
  // When scoped to a single state, filter the scan to that state. The prune
  // reads the SAME `stateCode` and filters its Typesense export identically, so
  // the two always operate on the same partition — otherwise the prune would
  // treat every other state's docs as stale and delete them.
  const base = stateCode ? ref.where("stateCode", "==", stateCode) : ref;
  const tag = logTag(name, stateCode);

  let imported = 0;
  let failed = 0;
  let pages = 0;
  let cursor: firestore.QueryDocumentSnapshot | null = null;
  // Every Firestore id seen across all pages — the authoritative set of docs
  // that SHOULD exist in Typesense (within scope). Drives the prune pass.
  const firestoreIds = new Set<string>();

  while (true) {
    let q = base.orderBy(firestore.FieldPath.documentId()).limit(batchSize);
    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;
    pages += 1;

    for (const d of snapshot.docs) firestoreIds.add(d.id);

    const docs = snapshot.docs.map((d) =>
      projectFields(
        d.data() as FirestoreDoc,
        fields,
        d.id,
        constantFields,
        derivedFields,
      ),
    );

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
  // authoritative — safe to delete anything in Typesense that isn't in it.
  const deleted = prune
    ? await pruneStaleDocs(client, name, firestoreIds, limiter, stateCode)
    : 0;

  console.info(
    `${tag} done — pages=${pages} imported=${imported} failed=${failed} deleted=${deleted}`,
  );
  return { name, pages, imported, failed, deleted };
}

export async function runBackfill(
  collectionsConfig: CollectionConfig[],
  stateCode?: string,
): Promise<BackfillSummary> {
  const client = buildTypesenseClient();

  // Process collections through a bounded worker pool rather than one-at-a-time,
  // overlapping the slow tail of large collections against the rest. A single
  // limiter shared across every collection caps the combined import request rate
  // so the backfill doesn't overwhelm the shared cluster (disabled when the rate
  // resolves to 0). The batch size is resolved once and applied to every page.
  const limiter = createRateLimiter(resolveImportRatePerSec());
  const batchSize = resolveBatchSize();
  const prune = resolvePruneStale();
  const results = await mapWithConcurrency(
    collectionsConfig,
    resolveConcurrency(),
    (config) =>
      backfillCollection(client, config, limiter, batchSize, prune, stateCode),
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
