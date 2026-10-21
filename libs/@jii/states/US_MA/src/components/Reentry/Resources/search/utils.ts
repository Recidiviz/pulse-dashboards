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

import Fuse, { IFuseOptions } from "fuse.js";

import { UsMaTFunction } from "~@jii/translation";

import { ResourceSummary } from "../types";
import { getTagLabels } from "../utils";

// As implemented in libs/@jii/states/US_NYC/src/hooks/utils.ts
export const SEARCH_OPTIONS: IFuseOptions<ResourceSummary> = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "description", weight: 0.3 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 3,
};

// Below this length, Fuse's fuzzy scoring is erratic (too little signal in
// the pattern to score reliably) - so short queries use a plain substring
// match instead.
const MIN_FUZZY_QUERY_LENGTH = 3;

function searchBySubstring(
  resources: ResourceSummary[],
  query: string,
): ResourceSummary[] {
  const lowerQuery = query.toLowerCase();
  const isNameMatch = (resource: ResourceSummary) =>
    resource.name.toLowerCase().includes(lowerQuery);
  // US_MA resources don't currently have descriptions, but including to maintain
  // parity with US_NYC functionality
  const isDescriptionMatch = (resource: ResourceSummary) =>
    resource.description?.toLowerCase().includes(lowerQuery);

  // sort is stable, so each group keeps the resources' original order.
  return resources
    .filter((resource) => isNameMatch(resource) || isDescriptionMatch(resource))
    .sort((a, b) => Number(isNameMatch(b)) - Number(isNameMatch(a)));
}

// Lowercases text, drops hyphens and apostrophes so "coed" matches "Co-ed",
// and adds a leading space so a match can only begin at the start of a word.
function normalizeForTagMatch(text: string): string {
  return ` ${text.toLocaleLowerCase().replace(/[-'’]/g, "")}`;
}

/**
 * Returns whether query appears in a tag's label starting at the beginning of
 * a word. Matching from word starts keeps "male" from matching "Female".
 */
export function matchesTagLabel(labels: string[], query: string): boolean {
  const needle = normalizeForTagMatch(query);
  if (!needle.trim()) return false;
  return labels.some((label) => normalizeForTagMatch(label).includes(needle));
}

/**
 * Returns the resources matching query by name, description, or tags.
 */
export function searchResources(
  resources: ResourceSummary[],
  query: string,
  fuseIndex: Fuse<ResourceSummary>,
  t: UsMaTFunction,
): ResourceSummary[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  if (trimmedQuery.length < MIN_FUZZY_QUERY_LENGTH) {
    return searchBySubstring(resources, trimmedQuery);
  }

  const textMatches = fuseIndex
    .search(trimmedQuery)
    .map((result) => result.item);
  const textMatchIds = new Set(
    textMatches.map((resource) => resource.organizationId),
  );
  const tagMatches = resources.filter(
    (resource) =>
      !textMatchIds.has(resource.organizationId) &&
      matchesTagLabel(getTagLabels(resource, t), trimmedQuery),
  );
  return [...textMatches, ...tagMatches];
}
