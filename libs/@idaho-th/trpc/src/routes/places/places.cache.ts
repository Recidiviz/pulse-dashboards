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

import {
  PLACE_DETAILS_CACHE_MAX_ENTRIES,
  PLACE_DETAILS_CACHE_TTL_MS,
} from "~@idaho-th/trpc/routes/places/constants";
import type { PlaceDetails } from "~@idaho-th/trpc/routes/places/places.types";

/**
 * Minimal in-process TTL + max-size cache. Place Details responses are
 * effectively static, so caching them removes repeat billable lookups.
 *
 * REVISIT AT SCALE: this lives in a single process's heap, so hit rates are
 * per-instance and the cache is cold on every deploy/restart. Fine for the
 * single-instance Idaho MVP. Migration trigger: full-state launch (Q2–Q3 2026)
 * or horizontal scaling to >1 instance, where a shared store materially
 * improves hit rate. Migration path: swap this singleton for a Redis-backed
 * cache behind the same `get`/`set` interface — no call-site changes needed.
 */
type CacheEntry<V> = {
  value: V;
  expiresAtMs: number;
};

export class TtlCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAtMs) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.store.delete(key);
    this.store.set(key, { value, expiresAtMs: Date.now() + this.ttlMs });
    this.evictOldest();
  }

  clear(): void {
    this.store.clear();
  }

  private evictOldest(): void {
    while (this.store.size > this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }
}

export function buildPlaceDetailsCacheKey(
  placeId: string,
  regionCode: string,
  languageCode: string,
): string {
  return `${regionCode}:${languageCode}:${placeId}`;
}

export const placeDetailsCache = new TtlCache<PlaceDetails>(
  PLACE_DETAILS_CACHE_MAX_ENTRIES,
  PLACE_DETAILS_CACHE_TTL_MS,
);

export function resetPlaceDetailsCacheForTesting(): void {
  placeDetailsCache.clear();
}
