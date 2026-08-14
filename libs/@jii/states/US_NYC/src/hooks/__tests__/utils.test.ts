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

import { faker } from "@faker-js/faker";

import { ResourceSummary } from "../../types";
import { buildCategoryGrid, getSimilarResources } from "../utils";

function makeResource(
  organizationId: number,
  ...categories: string[]
): ResourceSummary {
  return {
    organizationId,
    name: faker.company.name(),
    description: null,
    categories: categories.map((category) => ({ category, subcategory: "" })),
    tags: [],
    primaryContactMethod: null,
    primaryContactValue: null,
  };
}

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
      makeResource(1, "Youth"),
      makeResource(2, "Immigrants"),
      makeResource(3, "Veterans"),
    ];

    const { demographicCategories } = buildCategoryGrid(resources);

    const names = demographicCategories.map((c) => c.name);
    expect(names).toEqual(["Immigrants", "Veterans", "Youth"]);
  });

  test("help categories are sorted alphabetically", () => {
    const resources = [
      makeResource(1, "Housing"),
      makeResource(2, "Education"),
      makeResource(3, "Addiction"),
      makeResource(4, "Legal"),
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
      makeResource(1, "Housing"),
      makeResource(2, "Housing"),
      makeResource(3, "Housing"),
      makeResource(4, "Education"),
    ];

    const { helpCategories } = buildCategoryGrid(resources);

    expect(helpCategories).toEqual([
      { name: "Education", resourceCount: 1 },
      { name: "Housing", resourceCount: 3 },
    ]);
  });

  test("a resource with multiple categories is counted in each", () => {
    const resources = [makeResource(1, "Housing", "Legal", "Veterans")];

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
    const resources = [makeResource(1, "Housing")];

    const { demographicCategories } = buildCategoryGrid(resources);

    expect(demographicCategories).toHaveLength(0);
  });

  // This is the case when a resource has multiple subcategories within one category
  test("a resource with duplicate categories is counted once per category", () => {
    const resources = [makeResource(1, "Housing", "Housing")];

    const { helpCategories } = buildCategoryGrid(resources);

    expect(helpCategories).toEqual([{ name: "Housing", resourceCount: 1 }]);
  });

  test("a resource with both a help and demographic category appears in both grids", () => {
    const resources = [makeResource(1, "Housing", "Veterans")];

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
    const resources = [makeResource(1, "Older People", "LGBTQI+")];

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
    const resources = [makeResource(1, "Housing", "Legal")];

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
    makeResource(1, "Housing", "Veterans"),
    makeResource(2, "Housing"),
    makeResource(3, "Legal"),
    makeResource(4, "Education", "Youth"),
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
