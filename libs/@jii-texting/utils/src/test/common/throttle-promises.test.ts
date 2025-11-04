// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { PROMISES_BATCH_SIZE, throttlePromises } from "~@jii-texting/utils";

const mockPromiseFn = (value: string) => {
  return () => Promise.resolve(value);
};

describe("throttlePromises", () => {
  test("should return an empty array for an empty input array", async () => {
    const tasks: Array<() => Promise<string>> = [];

    const results = await throttlePromises(tasks, 3);

    expect(results).toEqual([]);
  });

  test("should reject if any promise in a batch rejects", async () => {
    const tasks = [
      mockPromiseFn("1"),
      mockPromiseFn("2"),
      () => Promise.reject(new Error("FAIL")),
    ];

    const promise = throttlePromises(tasks, PROMISES_BATCH_SIZE);

    await expect(promise).rejects.toThrow("FAIL");
  });

  test("num promises exceeds batch size; should resolve all promises and return results in the correct order", async () => {
    const allPromiseFns = [
      mockPromiseFn("1"),
      mockPromiseFn("2"),
      mockPromiseFn("3"),
      mockPromiseFn("4"),
      mockPromiseFn("5"),
    ];

    const results = await throttlePromises(allPromiseFns, PROMISES_BATCH_SIZE);

    expect(results).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("num promises less than batch size; should resolve all promises and return results in the correct order", async () => {
    const allPromiseFns = [
      mockPromiseFn("1"),
      mockPromiseFn("2"),
      mockPromiseFn("3"),
    ];

    const results = await throttlePromises(allPromiseFns, PROMISES_BATCH_SIZE);

    expect(results).toEqual(["1", "2", "3"]);
  });

  test("should run tasks in distinct, sequential batches", async () => {
    const startedTasks: string[] = [];
    const resolvers = new Map<string, () => void>();

    /**
     * A helper to create a task that:
     * 1. Records when it starts.
     * 2. Returns a promise that we can resolve manually from the test.
     */
    const createControllableTask = (value: string) => {
      return () => {
        startedTasks.push(value);
        return new Promise<string>((resolve) => {
          // Store the resolver function so the test can call it
          resolvers.set(value, () => resolve(value));
        });
      };
    };

    const tasks = [
      createControllableTask("T1"),
      createControllableTask("T2"),
      createControllableTask("T3"),
      createControllableTask("T4"),
      createControllableTask("T5"),
    ];

    const batchSize = 2;
    const promise = throttlePromises(tasks, batchSize);

    // --- Batch 1 ---
    // At this point, only the first batch [T1, T2] should have started.
    // The function is paused at the first `await Promise.all()`.
    expect(startedTasks).toEqual(["T1", "T2"]);

    // Manually resolve the first batch
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolvers.get("T1")!();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolvers.get("T2")!();

    // Wait for the loop to continue to the next batch
    await vi.waitFor(() => {
      // --- Batch 2 ---
      // The second batch [T3, T4] should now be started.
      expect(startedTasks).toEqual(["T1", "T2", "T3", "T4"]);
    });

    // Manually resolve the second batch
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolvers.get("T3")!();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolvers.get("T4")!();

    // Wait for the loop to continue to the final batch
    await vi.waitFor(() => {
      // --- Batch 3 ---
      // The final batch [T5] should now be started.
      expect(startedTasks).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    });

    // Manually resolve the final batch
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolvers.get("T5")!();

    // The main promise should now resolve with all results
    const results = await promise;
    expect(results).toEqual(["T1", "T2", "T3", "T4", "T5"]);
  });
});
