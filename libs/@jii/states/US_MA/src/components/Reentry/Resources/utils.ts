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

import { ResourceSummary } from "./types";

/**
 * Returns the resources in category grouped by subcategory, sorted by subcategory
 * name. A resource with several subcategories appears in each of their groups.
 * Category matching ignores case because the route uses "housing" while the
 * Resource API uses "Housing".
 */
export function groupResourcesBySubcategory(
  resources: ResourceSummary[],
  category: string,
): [string, ResourceSummary[]][] {
  const groups = new Map<string, ResourceSummary[]>();
  for (const resource of resources) {
    resource.categories
      .filter((cat) => cat.category.toLowerCase() === category.toLowerCase())
      .forEach(({ subcategory }) => {
        const group = groups.get(subcategory) ?? [];
        group.push(resource);
        groups.set(subcategory, group);
      });
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}
