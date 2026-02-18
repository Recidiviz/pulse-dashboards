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

import { addMilliseconds, addMinutes, addSeconds } from "date-fns";
import tk from "timekeeper";

import { createCachedCall } from "./createCachedCall";

const TTL_SECONDS = 5 * 60;
const BASE_TIME = new Date("2026-01-01T00:00:00Z");
const EXPIRY_TIME = addSeconds(BASE_TIME, TTL_SECONDS);
const JUST_BEFORE_EXPIRY = addMilliseconds(EXPIRY_TIME, -1);
const JUST_AFTER_EXPIRY = addMilliseconds(EXPIRY_TIME, 1);

// ES2024 includes Promise.withResolvers() with just these semantics,
// but we can't use it until we're on Node 22.
function promiseWithResolvers<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((r, e) => {
    resolve = r;
    reject = e;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  tk.reset();
});

describe("first call", () => {
  test("calls fn and returns its result", async () => {
    tk.freeze(BASE_TIME);
    const fn = vi.fn().mockResolvedValue("data");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe("data");
  });
});

describe("cache hits", () => {
  test("returns cached result on second call within TTL", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    await cachedCall();

    // Just under the TTL boundary
    tk.freeze(JUST_BEFORE_EXPIRY);
    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe("data");
  });

  test("cache TTL is measured from when the call was initiated, not when fn resolved", async () => {
    // fn takes 2 minutes to resolve; lastFetched is stamped at startTime (BASE_TIME),
    // not at resolution time (BASE_TIME + 2min).
    // A second call at BASE_TIME + TTL + 1ms is past the startTime-based TTL but
    // would still be within a resolution-time-based TTL. It should be a miss.
    const resolutionTime = addMinutes(BASE_TIME, 2);
    const { promise, resolve } = promiseWithResolvers<string>();
    const fn = vi
      .fn()
      .mockReturnValueOnce(promise)
      .mockResolvedValueOnce("fresh");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    const pending = cachedCall();

    tk.freeze(resolutionTime);
    resolve("data");
    await pending;

    // Past TTL from startTime (BASE_TIME + 5min + 1ms), but only 3min after resolution.
    // With resolution-time semantics this would be a cache hit; with startTime semantics
    // it must be a miss, triggering a second fn call.
    tk.freeze(JUST_AFTER_EXPIRY);
    await cachedCall();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("result is cached after in-flight completes", async () => {
    const { promise, resolve } = promiseWithResolvers<string>();
    const fn = vi.fn().mockReturnValue(promise);
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    const call1 = cachedCall();
    resolve("data");
    await call1;

    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe("data");
  });
});

describe("cache expiry", () => {
  test("refetches when cache is exactly at TTL boundary", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce("data1")
      .mockResolvedValueOnce("data2");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    await cachedCall();

    // differenceInMinutes returns an integer; at exactly TTL minutes the cache is stale
    tk.freeze(EXPIRY_TIME);
    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toBe("data2");
  });

  test("refetches after TTL expires", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce("data1")
      .mockResolvedValueOnce("data2");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    await cachedCall();

    tk.freeze(JUST_AFTER_EXPIRY);
    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toBe("data2");
  });
});

describe("in-flight deduplication", () => {
  test("concurrent calls share the same in-flight promise", async () => {
    const { promise, resolve } = promiseWithResolvers<string>();
    const fn = vi.fn().mockReturnValue(promise);
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    const call1 = cachedCall();
    const call2 = cachedCall();

    // fn should only have been called once despite two callers
    expect(fn).toHaveBeenCalledTimes(1);

    resolve("data");
    const [result1, result2] = await Promise.all([call1, call2]);

    expect(result1).toBe("data");
    expect(result2).toBe("data");
  });
});

describe("in-flight TTL expiry", () => {
  test("new call while stale in-flight is pending starts a fresh request", async () => {
    const { promise: firstPromise, resolve: resolveFirst } =
      promiseWithResolvers<string>();
    const fn = vi
      .fn()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce("data2");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    const call1 = cachedCall();

    // Advance past TTL while first request is still in-flight
    tk.freeze(JUST_AFTER_EXPIRY);
    const call2 = cachedCall();

    // A second fn call should have been made because the in-flight is stale
    expect(fn).toHaveBeenCalledTimes(2);

    resolveFirst("data1");
    const result2 = await call2;

    // call1 resolves to its own promise's value; there's no interception.
    expect(await call1).toBe("data1");
    expect(result2).toBe("data2");
  });

  test("stale in-flight resolving last does not overwrite newer cached data", async () => {
    const { promise: P1, resolve: resolveP1 } = promiseWithResolvers<string>();
    // P2 resolves immediately; P1 is held open until we manually resolve it
    const fn = vi.fn().mockReturnValueOnce(P1).mockResolvedValueOnce("data2");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    // Call #1 at T=0 → dispatches P1
    tk.freeze(BASE_TIME);
    const call1 = cachedCall();

    // Call #2 after TTL expires while P1 is still pending → dispatches P2
    tk.freeze(JUST_AFTER_EXPIRY);
    const call2 = cachedCall();
    expect(fn).toHaveBeenCalledTimes(2);

    // P2 resolves first, writing "data2" to the cache
    await call2;

    // P1 finally resolves with its own (now-stale) data
    resolveP1("data1");
    await call1;

    // A subsequent call must return the newer "data2", not the stale "data1"
    // that P1 carried
    const result = await cachedCall();
    expect(result).toBe("data2");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("error handling", () => {
  test("rejection is propagated to the caller", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("upstream failure"));
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);

    await expect(cachedCall()).rejects.toThrow("upstream failure");
  });

  test("all concurrent callers receive the same rejection", async () => {
    const { promise, reject } = promiseWithResolvers<string>();
    const fn = vi.fn().mockReturnValue(promise);
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    const call1 = cachedCall();
    const call2 = cachedCall();

    expect(fn).toHaveBeenCalledTimes(1);

    reject(new Error("upstream failure"));

    await expect(call1).rejects.toThrow("upstream failure");
    await expect(call2).rejects.toThrow("upstream failure");
  });

  test("in-flight is cleared after rejection, allowing a retry", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("upstream failure"))
      .mockResolvedValueOnce("data");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    await expect(cachedCall()).rejects.toThrow("upstream failure");

    // No cache was set; inflight was cleared. Next call should retry.
    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toBe("data");
  });

  test("successful retry result is cached", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("upstream failure"))
      .mockResolvedValueOnce("data");
    const cachedCall = createCachedCall(fn, TTL_SECONDS);

    tk.freeze(BASE_TIME);
    await expect(cachedCall()).rejects.toThrow();
    await cachedCall();

    // Third call should hit the cache populated by the successful retry
    const result = await cachedCall();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toBe("data");
  });
});
