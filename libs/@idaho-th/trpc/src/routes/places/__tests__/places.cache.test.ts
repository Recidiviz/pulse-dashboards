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

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPlaceDetailsCacheKey, TtlCache } from "../places.cache";

describe("TtlCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns stored values and undefined for misses", () => {
    const cache = new TtlCache<string>(10, 1000);
    cache.set("a", "1");

    expect(cache.get("a")).toBe("1");
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after the TTL", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(10, 1000);
    cache.set("a", "1");

    vi.advanceTimersByTime(999);
    expect(cache.get("a")).toBe("1");

    vi.advanceTimersByTime(2);
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the oldest entry past max size", () => {
    const cache = new TtlCache<string>(2, 1000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("refreshes recency on re-set so the survivor is kept", () => {
    const cache = new TtlCache<string>(2, 1000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("a", "1-updated");
    cache.set("c", "3");

    expect(cache.get("a")).toBe("1-updated");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe("3");
  });
});

describe("buildPlaceDetailsCacheKey", () => {
  it("namespaces by region and language", () => {
    expect(buildPlaceDetailsCacheKey("place-1", "US", "en")).toBe(
      "US:en:place-1",
    );
  });
});
