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
  buildCategoryGrid,
  getSimilarResources,
  groupResourcesBySubcategory,
  toggleFilterSelection,
} from "../utils";
import { makeResource } from "./testUtils";

describe("buildCategoryGrid", () => {
  test("returns empty arrays for empty input", () => {
    const { helpCategories, demographicCategories } = buildCategoryGrid([]);

    expect(helpCategories).toEqual([]);
    expect(demographicCategories).toEqual([]);
  });

  test("returns empty arrays when resources have no categories", () => {
    const resources = [makeResource(1), makeResource(2)];

    const { helpCategories, demographicCategories } =
      buildCategoryGrid(resources);

    expect(helpCategories).toEqual([]);
    expect(demographicCategories).toEqual([]);
  });

  test("demographic categories appear in the defined constant order", () => {
    const resources = [
      makeResource(1, [{ category: "Youth", subcategory: "" }]),
      makeResource(2, [{ category: "Immigrants", subcategory: "" }]),
      makeResource(3, [{ category: "Veterans", subcategory: "" }]),
    ];

    const { demographicCategories } = buildCategoryGrid(resources);

    const names = demographicCategories.map((c) => c.name);
    expect(names).toEqual(["Immigrants", "Veterans", "Youth"]);
  });

  test("help categories are sorted alphabetically", () => {
    const resources = [
      makeResource(1, [{ category: "Housing", subcategory: "" }]),
      makeResource(2, [{ category: "Education", subcategory: "" }]),
      makeResource(3, [{ category: "Addiction", subcategory: "" }]),
      makeResource(4, [{ category: "Legal", subcategory: "" }]),
    ];

    const { helpCategories } = buildCategoryGrid(resources);

    expect(helpCategories.map((c) => c.name)).toEqual([
      "Addiction",
      "Education",
      "Housing",
      "Legal",
    ]);
  });

  test("counts resources correctly across categories", () => {
    const resources = [
      makeResource(1, [{ category: "Housing", subcategory: "" }]),
      makeResource(2, [{ category: "Housing", subcategory: "" }]),
      makeResource(3, [{ category: "Housing", subcategory: "" }]),
      makeResource(4, [{ category: "Education", subcategory: "" }]),
    ];

    const { helpCategories } = buildCategoryGrid(resources);

    expect(helpCategories).toEqual([
      { name: "Education", resourceCount: 1 },
      { name: "Housing", resourceCount: 3 },
    ]);
  });

  test("a resource with multiple categories is counted in each", () => {
    const resources = [
      makeResource(1, [
        { category: "Housing", subcategory: "" },
        { category: "Legal", subcategory: "" },
        { category: "Veterans", subcategory: "" },
      ]),
    ];

    const { helpCategories, demographicCategories } =
      buildCategoryGrid(resources);

    expect(helpCategories).toContainEqual({
      name: "Housing",
      resourceCount: 1,
    });
    expect(helpCategories).toContainEqual({ name: "Legal", resourceCount: 1 });
    expect(
      demographicCategories.find((c) => c.name === "Veterans")?.resourceCount,
    ).toBe(1);
  });

  test("demographic categories with no matching resources are excluded", () => {
    const resources = [
      makeResource(1, [{ category: "Housing", subcategory: "" }]),
    ];

    const { demographicCategories } = buildCategoryGrid(resources);

    expect(demographicCategories).toHaveLength(0);
  });

  // This is the case when a resource has multiple subcategories within one category
  test("a resource with duplicate categories is counted once per category", () => {
    const resources = [
      makeResource(1, [
        { category: "Housing", subcategory: "" },
        { category: "Housing", subcategory: "" },
      ]),
    ];

    const { helpCategories } = buildCategoryGrid(resources);

    expect(helpCategories).toEqual([{ name: "Housing", resourceCount: 1 }]);
  });

  test("a resource with both a help and demographic category appears in both grids", () => {
    const resources = [
      makeResource(1, [
        { category: "Housing", subcategory: "" },
        { category: "Veterans", subcategory: "" },
      ]),
    ];

    const { helpCategories, demographicCategories } =
      buildCategoryGrid(resources);

    expect(helpCategories).toContainEqual({
      name: "Housing",
      resourceCount: 1,
    });
    expect(helpCategories.map((c) => c.name)).not.toContain("Veterans");
    expect(demographicCategories).toContainEqual({
      name: "Veterans",
      resourceCount: 1,
    });
  });

  test("a resource with two demographic categories contributes to two demographic tiles and no help tiles", () => {
    const resources = [
      makeResource(1, [
        { category: "Older People", subcategory: "" },
        { category: "LGBTQI+", subcategory: "" },
      ]),
    ];

    const { helpCategories, demographicCategories } =
      buildCategoryGrid(resources);

    expect(helpCategories).toHaveLength(0);
    expect(demographicCategories).toContainEqual({
      name: "Older People",
      resourceCount: 1,
    });
    expect(demographicCategories).toContainEqual({
      name: "LGBTQI+",
      resourceCount: 1,
    });
  });

  test("a resource with two help categories contributes to two help tiles and no demographic tiles", () => {
    const resources = [
      makeResource(1, [
        { category: "Housing", subcategory: "" },
        { category: "Legal", subcategory: "" },
      ]),
    ];

    const { helpCategories, demographicCategories } =
      buildCategoryGrid(resources);

    expect(demographicCategories).toHaveLength(0);
    expect(helpCategories).toContainEqual({
      name: "Housing",
      resourceCount: 1,
    });
    expect(helpCategories).toContainEqual({ name: "Legal", resourceCount: 1 });
  });
});

describe("getSimilarResources", () => {
  const resources = [
    makeResource(1, [
      { category: "Housing", subcategory: "" },
      { category: "Veterans", subcategory: "" },
    ]),
    makeResource(2, [{ category: "Housing", subcategory: "" }]),
    makeResource(3, [{ category: "Legal", subcategory: "" }]),
    makeResource(4, [
      { category: "Education", subcategory: "" },
      { category: "Youth", subcategory: "" },
    ]),
  ];

  test("returns all resources that have the given category", () => {
    const result = getSimilarResources(resources, "Housing", 0);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(resources[0]);
    expect(result[1]).toBe(resources[1]);
  });

  test("matches a resource when the category is one of several", () => {
    const result = getSimilarResources(resources, "Veterans", 0);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(resources[0]);
  });

  test("excludes the resource matching currentOrganizationId", () => {
    const result = getSimilarResources(resources, "Housing", 1);

    expect(result).toHaveLength(1);
    expect(result[0].organizationId).toBe(2);
  });

  test("returns empty array when no resources match", () => {
    expect(getSimilarResources(resources, "Addiction", 0)).toEqual([]);
  });

  test("returns empty array for empty input", () => {
    expect(getSimilarResources([], "Housing", 0)).toEqual([]);
  });

  test("match is exact and case-sensitive", () => {
    expect(getSimilarResources(resources, "housing", 0)).toEqual([]);
    expect(getSimilarResources(resources, "HOUSING", 0)).toEqual([]);
  });

  test("preserves the original resource object reference", () => {
    const result = getSimilarResources(resources, "Legal", 0);

    expect(result[0]).toBe(resources[2]);
  });
});

describe("groupResourcesBySubcategory", () => {
  test("returns an empty map for empty input", () => {
    expect(groupResourcesBySubcategory([], "Housing")).toEqual(new Map());
  });

  test("returns an empty map when no resources match the category", () => {
    const resources = [
      makeResource(1, [{ category: "Legal", subcategory: "Civil Rights" }]),
    ];

    expect(groupResourcesBySubcategory(resources, "Housing")).toEqual(
      new Map(),
    );
  });

  test("groups multiple resources by their subcategory", () => {
    const resource1 = makeResource(1, [
      { category: "Housing", subcategory: "Emergency Shelter" },
    ]);
    const resource2 = makeResource(2, [
      { category: "Housing", subcategory: "Transitional Housing" },
    ]);
    const resource3 = makeResource(3, [
      { category: "Housing", subcategory: "Emergency Shelter" },
    ]);

    const groups = groupResourcesBySubcategory(
      [resource1, resource2, resource3],
      "Housing",
    );

    expect(groups.get("Emergency Shelter")).toEqual([resource1, resource3]);
    expect(groups.get("Transitional Housing")).toEqual([resource2]);
  });

  test("a resource with two subcategories in the same category appears in both groups", () => {
    const resource = makeResource(1, [
      { category: "Housing", subcategory: "Emergency Shelter" },
      { category: "Housing", subcategory: "Transitional Housing" },
    ]);

    const groups = groupResourcesBySubcategory([resource], "Housing");

    expect(groups.get("Emergency Shelter")).toContain(resource);
    expect(groups.get("Transitional Housing")).toContain(resource);
  });

  test("only uses subcategories from the matching category", () => {
    const resource = makeResource(1, [
      { category: "Housing", subcategory: "Emergency Shelter" },
      { category: "Legal", subcategory: "Civil Rights" },
    ]);

    const groups = groupResourcesBySubcategory([resource], "Housing");

    expect(groups.size).toBe(1);
    expect(groups.has("Civil Rights")).toBe(false);
  });

  test("preserves the original resource object reference", () => {
    const resource = makeResource(1, [
      { category: "Housing", subcategory: "Emergency Shelter" },
    ]);

    const groups = groupResourcesBySubcategory([resource], "Housing");

    expect(groups.get("Emergency Shelter")?.[0]).toBe(resource);
  });
});

describe("toggleFilterSelection", () => {
  test("adds a value when it is not in the current selection", () => {
    expect(toggleFilterSelection([], "Housing")).toEqual(["Housing"]);
    expect(toggleFilterSelection(["Legal"], "Housing")).toEqual([
      "Legal",
      "Housing",
    ]);
  });

  test("removes a value when it is already in the current selection", () => {
    expect(toggleFilterSelection(["Housing"], "Housing")).toEqual([]);
    expect(toggleFilterSelection(["Housing", "Legal"], "Housing")).toEqual([
      "Legal",
    ]);
  });

  test("does not mutate the original array", () => {
    const original = ["Housing"];
    toggleFilterSelection(original, "Legal");
    expect(original).toEqual(["Housing"]);
  });
});
