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
  limiter: RateLimiter,
  batchSize: number,
): Promise<BackfillResult> {
  const db = firestore();
  const ref = db.collection(name);

  let imported = 0;
  let failed = 0;
  let pages = 0;
  let cursor: firestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let q = ref.orderBy(firestore.FieldPath.documentId()).limit(batchSize);
    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;
    pages += 1;

    const docs = snapshot.docs.map((d) =>
      projectFields(d.data() as FirestoreDoc, fields, d.id),
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
    if (snapshot.size < batchSize) break;
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

  // Process collections through a bounded worker pool rather than one-at-a-time,
  // overlapping the slow tail of large collections against the rest. A single
  // limiter shared across every collection caps the combined import request rate
  // so the backfill doesn't overwhelm the shared cluster (disabled when the rate
  // resolves to 0). The batch size is resolved once and applied to every page.
  const limiter = createRateLimiter(resolveImportRatePerSec());
  const batchSize = resolveBatchSize();
  const results = await mapWithConcurrency(
    collectionsConfig,
    resolveConcurrency(),
    (config) => backfillCollection(client, config, limiter, batchSize),
  );

  const totals = results.reduce(
    (acc, r) => ({
      imported: acc.imported + r.imported,
      failed: acc.failed + r.failed,
    }),
    { imported: 0, failed: 0 },
  );

  return { collections: results, totals };
}
