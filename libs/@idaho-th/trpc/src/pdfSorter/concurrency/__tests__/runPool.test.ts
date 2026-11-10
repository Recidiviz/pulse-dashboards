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

import { runPool } from "~@idaho-th/trpc/pdfSorter/concurrency/runPool";

describe("runPool", () => {
  it("returns one result per index, in index order", async () => {
    await expect(runPool(4, 2, async (index) => index * 2)).resolves.toEqual([
      0, 2, 4, 6,
    ]);
  });

  it("runs every index exactly once", async () => {
    const seen: number[] = [];

    await runPool(6, 3, async (index) => {
      seen.push(index);
      return index;
    });

    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;

    await runPool(8, 3, async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return null;
    });

    expect(peak).toBeLessThanOrEqual(3);
  });

  it("starts no more workers than there is work", async () => {
    let started = 0;

    await runPool(2, 10, async () => {
      started += 1;
      return null;
    });

    expect(started).toBe(2);
  });

  it("does nothing for zero items", async () => {
    const worker = vi.fn();

    await expect(runPool(0, 4, worker)).resolves.toEqual([]);
    expect(worker).not.toHaveBeenCalled();
  });

  it("propagates the first rejection", async () => {
    const failure = new Error("page 3 failed");

    await expect(
      runPool(4, 2, async (index) => {
        if (index === 2) throw failure;
        return index;
      }),
    ).rejects.toBe(failure);
  });
});
