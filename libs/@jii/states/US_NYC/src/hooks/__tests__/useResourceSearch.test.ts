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

import { act, renderHook } from "@testing-library/react";

import { useResourceSearch } from "../useResourceSearch";
import { makeResource } from "./testUtils";

const resources = [
  makeResource(1, [], [], { name: "Goodwill Industries" }),
  makeResource(2, [], [], { name: "Housing Works" }),
];

test("returns matching resources for a query", () => {
  const { result } = renderHook(() => useResourceSearch(resources, "Goodwill"));

  expect(result.current.results.map((r) => r.organizationId)).toEqual([1]);
});

test("returns an empty array when the query is empty", () => {
  const { result } = renderHook(() => useResourceSearch(resources, ""));

  expect(result.current.results).toEqual([]);
});

test("caps results at 20 for a broad query matching many resources", () => {
  const manyResources = Array.from({ length: 30 }, (_, i) =>
    makeResource(i, [], [], { name: `Housing Program ${i}` }),
  );

  const { result } = renderHook(() =>
    useResourceSearch(manyResources, "Housing"),
  );

  expect(result.current.results).toHaveLength(20);
});

test("debounces results after a query change instead of updating immediately", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ query }) => useResourceSearch(resources, query),
    { initialProps: { query: "" } },
  );

  rerender({ query: "Goodwill" });
  expect(result.current.results).toEqual([]);

  act(() => {
    vi.runAllTimers();
  });
  expect(result.current.results.map((r) => r.organizationId)).toEqual([1]);

  vi.useRealTimers();
});

test("reports isQueryPending until the debounce settles", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ query }) => useResourceSearch(resources, query),
    { initialProps: { query: "" } },
  );

  expect(result.current.isQueryPending).toBe(false);

  rerender({ query: "Goodwill" });
  expect(result.current.isQueryPending).toBe(true);

  act(() => {
    vi.runAllTimers();
  });
  expect(result.current.isQueryPending).toBe(false);

  vi.useRealTimers();
});

test("calls trackSearchQuery with the settled query and result count", () => {
  vi.useFakeTimers();
  const trackSearchQuery = vi.fn();
  const { rerender } = renderHook(
    ({ query }) => useResourceSearch(resources, query, trackSearchQuery),
    { initialProps: { query: "" } },
  );

  rerender({ query: "Goodwill" });
  expect(trackSearchQuery).not.toHaveBeenCalled();

  act(() => {
    vi.runAllTimers();
  });
  expect(trackSearchQuery).toHaveBeenCalledExactlyOnceWith("Goodwill", 1);

  vi.useRealTimers();
});

test("does not call trackSearchQuery for an empty query", () => {
  vi.useFakeTimers();
  const trackSearchQuery = vi.fn();
  renderHook(() => useResourceSearch(resources, "", trackSearchQuery));

  act(() => {
    vi.runAllTimers();
  });
  expect(trackSearchQuery).not.toHaveBeenCalled();

  vi.useRealTimers();
});

describe("Fuse index memoization", () => {
  async function setupMockedSearch() {
    vi.resetModules();
    vi.doMock("fuse.js", () => ({ default: vi.fn() }));
    // Re-imported fresh so its own internal Fuse binding re-resolves against the mock above
    const { useResourceSearch } = await import("../useResourceSearch");
    const { default: Fuse } = await import("fuse.js");
    return { useResourceSearch, Fuse };
  }

  test("reuses the Fuse index across re-renders when resources are unchanged", async () => {
    const { useResourceSearch, Fuse } = await setupMockedSearch();

    const { rerender } = renderHook(
      ({ query }) => useResourceSearch(resources, query),
      { initialProps: { query: "a" } },
    );
    rerender({ query: "ab" });

    expect(Fuse).toHaveBeenCalledTimes(1);
  });

  test("rebuilds the Fuse index when the resource list changes", async () => {
    const { useResourceSearch, Fuse } = await setupMockedSearch();
    const resourcesB = [makeResource(3, [], [], { name: "Legal Aid Society" })];

    const { rerender } = renderHook(
      ({ resources }) => useResourceSearch(resources, ""),
      { initialProps: { resources } },
    );
    rerender({ resources: resourcesB });

    expect(Fuse).toHaveBeenCalledTimes(2);
  });
});
