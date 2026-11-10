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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { delayMs, withTimeout } from "../withTimeout";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the promise's value when it settles first", async () => {
    const result = withTimeout(
      Promise.resolve("done"),
      1_000,
      () => new Error("timed out"),
    );

    await expect(result).resolves.toBe("done");
  });

  it("propagates the promise's own rejection rather than the timeout error", async () => {
    const failure = new Error("upstream failed");
    const result = withTimeout(
      Promise.reject(failure),
      1_000,
      () => new Error("timed out"),
    );

    await expect(result).rejects.toBe(failure);
  });

  it("rejects with onTimeout()'s error once the deadline passes", async () => {
    const timeoutError = new Error("timed out");
    const result = withTimeout(
      new Promise<string>(() => {
        /* never settles */
      }),
      1_000,
      () => timeoutError,
    );
    await Promise.all([
      expect(result).rejects.toBe(timeoutError),
      vi.advanceTimersByTimeAsync(1_000),
    ]);
  });

  it("rejects immediately, without arming a timer, for a non-positive timeout", async () => {
    const timeoutError = new Error("timed out");

    await expect(
      withTimeout(Promise.resolve("done"), 0, () => timeoutError),
    ).rejects.toBe(timeoutError);
    await expect(
      withTimeout(Promise.resolve("done"), -1, () => timeoutError),
    ).rejects.toBe(timeoutError);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the timer when the promise wins, so nothing keeps the loop alive", async () => {
    await withTimeout(
      Promise.resolve("done"),
      60_000,
      () => new Error("timed out"),
    );

    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the timer when the promise rejects", async () => {
    await expect(
      withTimeout(
        Promise.reject(new Error("upstream")),
        60_000,
        () => new Error("timed out"),
      ),
    ).rejects.toThrow("upstream");

    expect(vi.getTimerCount()).toBe(0);
  });

  it("only calls onTimeout when the timeout actually wins", async () => {
    const onTimeout = vi.fn(() => new Error("timed out"));

    await withTimeout(Promise.resolve("done"), 60_000, onTimeout);

    expect(onTimeout).not.toHaveBeenCalled();
  });
});

describe("delayMs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves only after the delay elapses", async () => {
    const settled = vi.fn();
    const pending = delayMs(500).then(settled);

    await vi.advanceTimersByTimeAsync(499);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toHaveBeenCalledOnce();
  });
});
