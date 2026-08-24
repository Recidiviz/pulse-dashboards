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

// The four env-var knobs. Terraform owns the deployed values (see the
// typesense-backfill component's variables.tf); the defaults here are what a
// bare local run gets, and are deliberately more conservative.
//
// Every resolver is total — a malformed value falls back to the default rather
// than throwing, because a backfill that refuses to start over a typo'd env var
// is worse than one that runs at a safe default.
//
// Read once per run by runBackfill, never mid-run, so a run's behaviour cannot
// change under it.

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
// that's the limiter (concurrency bounds in-flight requests, not their rate).
// See the header of throttle.ts for why both exist. Override via env.
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
// Firestore source (see steps 5 and 6 in the backfill.ts header). ON by default —
// parity with the ETL's Firestore deletes is the whole point. Set
// BACKFILL_PRUNE_STALE=false to run an import-only pass (e.g. to isolate an
// import problem, or seed a fresh collection before the source is fully
// populated) without the destructive delete phase. Only the literal "false"
// (case-insensitive) disables it; any other value — including unset — leaves
// pruning on.
export function resolvePruneStale(): boolean {
  const raw = process.env["BACKFILL_PRUNE_STALE"];
  if (raw === undefined) return true;
  return raw.trim().toLowerCase() !== "false";
}
