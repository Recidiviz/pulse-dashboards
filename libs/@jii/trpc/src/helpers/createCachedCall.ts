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

import { differenceInSeconds } from "date-fns";

/**
 * Wraps a function with in-memory caching. Returns the cached return value of
 * `fn` if it was called within `ttlSeconds`; otherwise calls `fn` again.
 *
 * When `fn` returns a Promise, concurrent calls can share the same pending Promise
 * rather than launching separate requests. There is one special behavior for async
 * functions: if the Promise rejects, the cache entry is cleared so the next caller
 * retries rather than receiving a cached rejection.
 *
 * TTL is measured from when `fn` was called, not when its Promise resolved.
 *
 * @param fn - The function to cache.
 * @param ttlSeconds - How long (in seconds) the cached result is considered fresh.
 * @returns A wrapped version of `fn` that applies the caching behavior.
 */
export function createCachedCall<T>(fn: () => T, ttlSeconds: number): () => T {
  let cache: { data: T; lastFetched: Date } | undefined;

  return () => {
    if (
      cache &&
      differenceInSeconds(new Date(), cache.lastFetched) < ttlSeconds
    ) {
      return cache.data;
    }

    const entry = { data: fn(), lastFetched: new Date() };
    cache = entry;
    if (entry.data instanceof Promise) {
      entry.data.catch(() => {
        if (cache === entry) cache = undefined;
      });
    }
    return entry.data;
  };
}
