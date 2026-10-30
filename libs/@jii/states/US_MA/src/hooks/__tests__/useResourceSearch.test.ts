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

import { UsMaTFunction } from "~@jii/translation";

import {
  loadUsMaTranslations,
  makeResource,
} from "../../components/Reentry/Resources/__tests__/testUtils";
import { SEARCH_DEBOUNCE_MS, useResourceSearch } from "../useResourceSearch";

const resources = [
  makeResource(1, { name: "Vanderburgh House" }),
  makeResource(2, { name: "Homeless not Hopeless Shelter" }),
];

let t: UsMaTFunction;

beforeAll(async () => {
  t = await loadUsMaTranslations();
});

afterEach(() => {
  vi.useRealTimers();
});

test("returns matching resources for a query", () => {
  const { result } = renderHook(() =>
    useResourceSearch(resources, "Vanderburgh", t),
  );

  expect(result.current.results.map((r) => r.organizationId)).toEqual([1]);
});

test("returns an empty array when the query is empty", () => {
  const { result } = renderHook(() => useResourceSearch(resources, "", t));

  expect(result.current.results).toEqual([]);
});

test("caps results at 20 for a broad query matching many resources", () => {
  const manyResources = Array.from({ length: 30 }, (_, i) =>
    makeResource(i, { name: `Sober House ${i}` }),
  );

  const { result } = renderHook(() =>
    useResourceSearch(manyResources, "Sober", t),
  );

  expect(result.current.results).toHaveLength(20);
});

test("debounces results and reports isQueryPending until they settle", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ query }) => useResourceSearch(resources, query, t),
    { initialProps: { query: "" } },
  );
  expect(result.current.isQueryPending).toBe(false);

  rerender({ query: "Vanderburgh" });
  expect(result.current.results).toEqual([]);
  expect(result.current.isQueryPending).toBe(true);

  act(() => {
    vi.runAllTimers();
  });
  expect(result.current.results.map((r) => r.organizationId)).toEqual([1]);
  expect(result.current.isQueryPending).toBe(false);
});

test("tracks each settled query once with its result count", () => {
  vi.useFakeTimers();
  const trackSearchQuery = vi.fn();
  const { rerender } = renderHook(
    ({ query }) => useResourceSearch(resources, query, t, trackSearchQuery),
    { initialProps: { query: "" } },
  );

  rerender({ query: "Vanderburgh" });
  expect(trackSearchQuery).not.toHaveBeenCalled();

  act(() => {
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });
  rerender({ query: "Vanderburgh" });

  expect(trackSearchQuery).toHaveBeenCalledExactlyOnceWith("Vanderburgh", 1);
});
