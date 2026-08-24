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

import { createRateLimiter, mapWithConcurrency } from "../src/throttle";

describe("createRateLimiter", () => {
  // Records every sleep request so we can assert how long each `take()` waited.
  // `now` is held constant so the assertions reflect the limiter's internal slot
  // reservation (nextAllowedAt) rather than a moving wall clock.
  function fakeClock(at = 0) {
    const sleeps: number[] = [];
    const now = (): number => at;
    const sleep = async (ms: number): Promise<void> => {
      sleeps.push(ms);
    };
    return { sleeps, now, sleep };
  }

  it("does not delay the very first permit", async () => {
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(10, now, sleep);
    await limiter.take();
    expect(sleeps).toEqual([]);
  });

  it("spaces sequential permits by 1000/ratePerSec ms", async () => {
    // 10/s => 100ms minimum interval.
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(10, now, sleep);
    await limiter.take();
    await limiter.take();
    await limiter.take();
    // First is free; each subsequent slot is pushed out another 100ms from a
    // fixed `now`, so the waits grow 100, 200.
    expect(sleeps).toEqual([100, 200]);
  });

  it("serializes concurrent callers FIFO, each spaced by the interval", async () => {
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(8, now, sleep); // 125ms interval
    await Promise.all([limiter.take(), limiter.take(), limiter.take()]);
    expect(sleeps).toEqual([125, 250]);
  });

  it("honors the configured rate (lower rate => longer gaps)", async () => {
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(2, now, sleep); // 500ms interval
    await limiter.take();
    await limiter.take();
    expect(sleeps).toEqual([500]);
  });

  it("does not wait when the reserved slot is already in the past", async () => {
    // Advance `now` past the reserved slot between calls: no backlog accrues.
    let clock = 0;
    const sleeps: number[] = [];
    const limiter = createRateLimiter(
      10,
      () => clock,
      async (ms) => {
        sleeps.push(ms);
      },
    );
    await limiter.take(); // reserves slot at 0, next allowed = 100
    clock = 1000; // a full second later — well past the reserved slot
    await limiter.take();
    expect(sleeps).toEqual([]); // neither call needed to wait
  });

  it.each([0, -1, Infinity, NaN])(
    "is disabled (never sleeps) for a non-positive/non-finite rate %p",
    async (rate) => {
      const { sleeps, now, sleep } = fakeClock();
      const limiter = createRateLimiter(rate, now, sleep);
      // Many back-to-back permits, none of which should ever wait.
      await limiter.take();
      await limiter.take();
      await limiter.take();
      expect(sleeps).toEqual([]);
    },
  );
});

describe("mapWithConcurrency", () => {
  // A deferred promise plus a manual resolve handle — lets a test hold tasks
  // open to observe how many run at once, then release them deliberately.
  function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  it("returns results in INPUT order regardless of completion order", async () => {
    // Later items resolve first; output must still match input order.
    const results = await mapWithConcurrency(
      [10, 20, 30],
      3,
      (item, index) =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve(`${index}:${item}`), (3 - index) * 5);
        }),
    );
    expect(results).toEqual(["0:10", "1:20", "2:30"]);
  });

  it("passes the item and its index to the task", async () => {
    const seen: Array<[string, number]> = [];
    await mapWithConcurrency(["a", "b", "c"], 2, async (item, index) => {
      seen.push([item, index]);
    });
    expect(seen).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ]);
  });

  it("never runs more than `concurrency` tasks at once", async () => {
    const gates = Array.from({ length: 6 }, () => deferred<void>());
    let active = 0;
    let peak = 0;

    const run = mapWithConcurrency(gates, 2, async (gate) => {
      active += 1;
      peak = Math.max(peak, active);
      await gate.promise;
      active -= 1;
    });

    // Release gates one at a time, letting the pool refill between each. At no
    // point should more than 2 tasks be active. The serial await is the point
    // here — we step the pool one resolution at a time.
    for (const gate of gates) {
      // eslint-disable-next-line no-await-in-loop -- intentional serial stepping
      await Promise.resolve(); // flush microtasks so a worker can pick up work
      expect(active).toBeLessThanOrEqual(2);
      gate.resolve();
    }

    await run;
    expect(peak).toBe(2);
  });

  it("clamps concurrency to the item count (oversized limit is harmless)", async () => {
    let active = 0;
    let peak = 0;
    await mapWithConcurrency([1, 2], 100, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
    });
    // Only 2 items, so peak can't exceed 2 even with a limit of 100.
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("returns an empty array and runs no tasks for empty input", async () => {
    const task = vi.fn();
    const results = await mapWithConcurrency([], 3, task);
    expect(results).toEqual([]);
    expect(task).not.toHaveBeenCalled();
  });

  it("processes every item with a concurrency of 1 (fully serial)", async () => {
    let active = 0;
    let peak = 0;
    const results = await mapWithConcurrency([1, 2, 3, 4], 1, async (item) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return item * 2;
    });
    expect(results).toEqual([2, 4, 6, 8]);
    expect(peak).toBe(1);
  });
});
