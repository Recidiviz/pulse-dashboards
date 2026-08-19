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

import { US_NYC_DEMOGRAPHIC_CATEGORIES } from "../constants";
import { ResourceSummary } from "../types";
import { CategoryGrid } from "./types";

export function buildCategoryGrid(resources: ResourceSummary[]): CategoryGrid {
  const categoryCounts = resources
    .flatMap((resource) => [
      ...new Set(
        resource.categories.map((categorization) => categorization.category),
      ),
    ])
    .reduce<Map<string, number>>((counts, category) => {
      counts.set(category, (counts.get(category) ?? 0) + 1);
      return counts;
    }, new Map());

  const demographicSet = new Set(US_NYC_DEMOGRAPHIC_CATEGORIES);

  // Excludes demographic categories with no resources
  const demographicCategories = US_NYC_DEMOGRAPHIC_CATEGORIES.flatMap(
    (name) => {
      const resourceCount = categoryCounts.get(name) ?? 0;
      return resourceCount > 0 ? [{ name, resourceCount }] : [];
    },
  );

  // Demographic category names never appear as help tiles — but a resource tagged with
  // both a help and demographic category (e.g. "Housing" + "Veterans") contributes to
  // a tile in each grid
  const helpCategories = [...categoryCounts.entries()]
    .filter(([name]) => !demographicSet.has(name))
    .map(([name, resourceCount]) => ({ name, resourceCount }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { helpCategories, demographicCategories };
}

export function getSimilarResources(
  resources: ResourceSummary[],
  category: string,
  currentOrganizationId: number,
): ResourceSummary[] {
  return resources.filter(
    ({ organizationId, categories }) =>
      // Prevents the currently viewed resource from appearing in its own similar resources list
      organizationId !== currentOrganizationId &&
      categories.some((c) => c.category === category),
  );
}

export function groupResourcesBySubcategory(
  resources: ResourceSummary[],
  category: string,
): Map<string, ResourceSummary[]> {
  const groups = new Map<string, ResourceSummary[]>();
  for (const resource of resources) {
    resource.categories
      .filter((cat) => cat.category === category)
      .forEach(({ subcategory }) => {
        const group = groups.get(subcategory) ?? [];
        group.push(resource);
        groups.set(subcategory, group);
      });
  }
  return groups;
}

export function toggleFilterSelection(
  currentValues: string[],
  selectedValue: string,
): string[] {
  return currentValues.includes(selectedValue)
    ? currentValues.filter((currentValue) => currentValue !== selectedValue)
    : [...currentValues, selectedValue];
}
