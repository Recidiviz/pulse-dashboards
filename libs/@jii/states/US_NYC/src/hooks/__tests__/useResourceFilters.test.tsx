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
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ResourceSummary } from "../../types";
import { useResourceFilters } from "../useResourceFilters";
import { makeResource } from "./testUtils";

const resources: ResourceSummary[] = [
  makeResource(
    1,
    [{ category: "Housing", subcategory: "Emergency Shelter" }],
    ["spanish"],
  ),
  makeResource(
    2,
    [
      { category: "Housing", subcategory: "Emergency Shelter" },
      { category: "Housing", subcategory: "Transitional Housing" },
    ],
    ["spanish", "english"],
  ),
  makeResource(
    3,
    [{ category: "Legal", subcategory: "Expungement" }],
    ["english"],
  ),
];

function wrapper(initialSearch = "") {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={[
          `/new-york-city/abc/resources/categories/Housing${initialSearch}`,
        ]}
      >
        <Routes>
          <Route
            path="/new-york-city/:personPseudoId/resources/categories/:category"
            element={<>{children}</>}
          />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe("filteredCategoryResources", () => {
  test("returns only resources in the given category when no filters are active", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(2);
    expect(
      result.current.filteredCategoryResources.map((r) => r.organizationId),
    ).toEqual([1, 2]);
  });

  test("excludes resources from other categories even when they match active filters", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Expungement"),
    });

    // "Expungement" is a Legal subcategory, so no Housing resource can match
    expect(result.current.filteredCategoryResources).toHaveLength(0);
  });

  test("filters by a single subcategory within the category", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Emergency+Shelter"),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(2);
    expect(
      result.current.filteredCategoryResources.map((r) => r.organizationId),
    ).toEqual([1, 2]);
  });

  test("AND-within subcategories: returns only resources that carry all selected subcategories", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(
        "?subcategories=Emergency+Shelter&subcategories=Transitional+Housing",
      ),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(1);
    expect(result.current.filteredCategoryResources[0].organizationId).toBe(2);
  });

  test("filters by a single tag", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?tags=spanish"),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(2);
    expect(
      result.current.filteredCategoryResources.map((r) => r.organizationId),
    ).toEqual([1, 2]);
  });

  test("AND-within tags: returns only resources that carry all selected tags", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?tags=spanish&tags=english"),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(1);
    expect(result.current.filteredCategoryResources[0].organizationId).toBe(2);
  });

  test("AND-across: resource must satisfy both subcategory and tag filters", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Emergency+Shelter&tags=english"),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(1);
    expect(result.current.filteredCategoryResources[0].organizationId).toBe(2);
  });

  test("returns empty array when no resources match the active filters", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Nonsense"),
    });

    expect(result.current.filteredCategoryResources).toHaveLength(0);
  });
});

describe("availableSubcategories and availableTags", () => {
  test("reflects all subcategories in the category regardless of active filters", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Emergency+Shelter"),
    });

    expect(result.current.availableSubcategories).toEqual([
      "Emergency Shelter",
      "Transitional Housing",
    ]);
  });

  test("reflects all tags on category resources regardless of active filters", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?tags=spanish"),
    });

    expect(result.current.availableTags).toEqual(["english", "spanish"]);
  });

  test("does not include subcategories from other categories", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(),
    });

    expect(result.current.availableSubcategories).not.toContain("Expungement");
  });
});

describe("selectedSubcategories and selectedTags", () => {
  test("reflects active subcategory selections from the URL", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(
        "?subcategories=Emergency+Shelter&subcategories=Transitional+Housing",
      ),
    });

    expect(result.current.selectedSubcategories).toEqual([
      "Emergency Shelter",
      "Transitional Housing",
    ]);
  });

  test("reflects active tag selections from the URL", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?tags=spanish"),
    });

    expect(result.current.selectedTags).toEqual(["spanish"]);
  });
});

describe("hasActiveFilters", () => {
  test("is false when no filters are selected", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(),
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  test("is true when subcategories are selected", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Emergency+Shelter"),
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  test("is true when tags are selected", () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?tags=spanish"),
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });
});

describe("toggleSubcategory", () => {
  test("adds a subcategory to the URL when toggled on", async () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(),
    });

    await act(async () => {
      result.current.toggleSubcategory("Emergency Shelter");
    });

    expect(result.current.selectedSubcategories).toEqual(["Emergency Shelter"]);
  });

  test("removes a subcategory from the URL when toggled off", async () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Emergency+Shelter"),
    });

    await act(async () => {
      result.current.toggleSubcategory("Emergency Shelter");
    });

    expect(result.current.selectedSubcategories).toEqual([]);
  });
});

describe("toggleTag", () => {
  test("adds a tag to the URL when toggled on", async () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper(),
    });

    await act(async () => {
      result.current.toggleTag("spanish");
    });

    expect(result.current.selectedTags).toEqual(["spanish"]);
  });

  test("removes a tag from the URL when toggled off", async () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?tags=spanish"),
    });

    await act(async () => {
      result.current.toggleTag("spanish");
    });

    expect(result.current.selectedTags).toEqual([]);
  });
});

describe("clearFilters", () => {
  test("removes all subcategories and tags from the URL", async () => {
    const { result } = renderHook(() => useResourceFilters(resources), {
      wrapper: wrapper("?subcategories=Emergency+Shelter&tags=spanish"),
    });

    await act(async () => {
      result.current.clearFilters();
    });

    expect(result.current.selectedSubcategories).toEqual([]);
    expect(result.current.selectedTags).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
