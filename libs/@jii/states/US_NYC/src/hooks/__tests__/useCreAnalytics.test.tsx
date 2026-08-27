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

import { renderHook } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { useRootStore } from "~@jii/data";

import { useCreAnalytics } from "../useCreAnalytics";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

const trackCreCategorySelected = vi.fn();
const trackCreSubcategorySelected = vi.fn();
const trackCreFiltersUpdated = vi.fn();
const trackCreFilterCleared = vi.fn();
const trackCreResourceViewed = vi.fn();
const trackCreDescriptionToggled = vi.fn();

beforeEach(() => {
  vi.mocked(useRootStore).mockReturnValue({
    userStore: {
      segmentClient: {
        trackCreCategorySelected,
        trackCreSubcategorySelected,
        trackCreFiltersUpdated,
        trackCreFilterCleared,
        trackCreResourceViewed,
        trackCreDescriptionToggled,
      },
    },
  } as unknown as ReturnType<typeof useRootStore>);
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/new-york-city/abc/resources"]}>
      <Routes>
        <Route
          path="/:stateSlug/:personPseudoId/resources"
          element={<>{children}</>}
        />
      </Routes>
    </MemoryRouter>
  );
}

test("trackCategorySelected calls segmentClient with the resident id and category", () => {
  const { result } = renderHook(() => useCreAnalytics(), { wrapper });

  result.current.trackCategorySelected("Housing");

  expect(trackCreCategorySelected).toHaveBeenCalledExactlyOnceWith({
    justiceInvolvedPersonPseudoId: "abc",
    category: "Housing",
  });
});

test("trackSubcategorySelected calls segmentClient with the accordion's open state", () => {
  const { result } = renderHook(() => useCreAnalytics(), { wrapper });

  result.current.trackSubcategorySelected("Housing", "Emergency Shelter", true);

  expect(trackCreSubcategorySelected).toHaveBeenCalledExactlyOnceWith({
    justiceInvolvedPersonPseudoId: "abc",
    category: "Housing",
    subcategory: "Emergency Shelter",
    isOpen: true,
  });
});

test("trackFiltersUpdated calls segmentClient with the resulting filter state", () => {
  const { result } = renderHook(() => useCreAnalytics(), { wrapper });

  result.current.trackFiltersUpdated(
    "Housing",
    ["Emergency Shelter"],
    ["spanish"],
  );

  expect(trackCreFiltersUpdated).toHaveBeenCalledExactlyOnceWith({
    justiceInvolvedPersonPseudoId: "abc",
    category: "Housing",
    subcategories: ["Emergency Shelter"],
    tags: ["spanish"],
  });
});

test("trackFilterCleared calls segmentClient with the category", () => {
  const { result } = renderHook(() => useCreAnalytics(), { wrapper });

  result.current.trackFilterCleared("Housing");

  expect(trackCreFilterCleared).toHaveBeenCalledExactlyOnceWith({
    justiceInvolvedPersonPseudoId: "abc",
    category: "Housing",
  });
});

test("trackResourceViewed calls segmentClient with the resource id and name", () => {
  const { result } = renderHook(() => useCreAnalytics(), { wrapper });

  result.current.trackResourceViewed(1, "East Harlem Employment Center");

  expect(trackCreResourceViewed).toHaveBeenCalledExactlyOnceWith({
    justiceInvolvedPersonPseudoId: "abc",
    resourceId: 1,
    resourceName: "East Harlem Employment Center",
  });
});

test("trackDescriptionToggled calls segmentClient with the expanded state", () => {
  const { result } = renderHook(() => useCreAnalytics(), { wrapper });

  result.current.trackDescriptionToggled(
    1,
    "East Harlem Employment Center",
    true,
  );

  expect(trackCreDescriptionToggled).toHaveBeenCalledExactlyOnceWith({
    justiceInvolvedPersonPseudoId: "abc",
    resourceId: 1,
    resourceName: "East Harlem Employment Center",
    isExpanded: true,
  });
});
