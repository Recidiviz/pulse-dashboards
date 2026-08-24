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

// Two non-interchangeable ways of bounding work, and the backfill needs both:
// createRateLimiter bounds the RATE of requests, mapWithConcurrency bounds the
// PARALLELISM of tasks. Concurrency alone cannot hold a rate (3 workers issuing
// fast requests still flood the cluster); a rate limit alone cannot hold memory
// (unbounded parallel collections each buffer a page of docs).

/* eslint-disable no-await-in-loop --
 * The worker loop in mapWithConcurrency awaits one task per iteration BY
 * DESIGN — that serial await is what makes a worker a worker. Parallelism comes
 * from running several workers, not from firing a worker's tasks concurrently.
 */

export type RateLimiter = {
  take(): Promise<void>;
};

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
