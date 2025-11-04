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

/**
 * Throttles an array of promise-returning functions, executing them in
 * batches of a specified size.
 * Typescript-ified from https://blog.stackademic.com/throttled-promise-in-javascript-d6085e6a95b3
 * TODO(#10425): Rather than batching promises, consider scoping out how to do batched writes
 *
 * @param promiseFactories An array of functions that each return a Promise.
 * @param size The number of promises to execute in parallel in each batch.
 * @returns A Promise that resolves to an array of all results from all promises.
 */
export async function throttlePromises<T>(
  promiseFns: Array<() => Promise<T>>,
  size: number,
): Promise<T[]> {
  if (size <= 0) {
    return Promise.reject(new Error("Batch size must be a positive number."));
  }

  const results: T[] = [];
  let nextBatchIndex = 0;
  const totalPromises = promiseFns.length;

  // Handle empty input array
  if (totalPromises === 0) {
    return Promise.resolve([]);
  }

  return new Promise<T[]>((resolve, reject) => {
    // This is the recursive function
    (function processNextBatch() {
      const start = nextBatchIndex;
      const end = Math.min(nextBatchIndex + size, totalPromises);

      const promiseFnsBatch = promiseFns.slice(start, end);

      const batchPromises = promiseFnsBatch.map((promiseFn) => promiseFn());

      Promise.all(batchPromises)
        .then((batchResults) => {
          batchResults.forEach((result) => results.push(result));

          if (results.length === totalPromises) {
            return resolve(results);
          }

          // If not done, update the index and process the next batch
          nextBatchIndex = end;
          processNextBatch();
        })
        .catch((err) => {
          // If any promise in the batch rejects, reject the whole operation
          return reject(err);
        });
    })();
  });
}
