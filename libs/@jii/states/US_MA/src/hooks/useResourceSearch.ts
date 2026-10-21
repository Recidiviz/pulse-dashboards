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

import Fuse from "fuse.js";
import { useMemo } from "react";

import { UsMaTFunction } from "~@jii/translation";

import {
  SEARCH_OPTIONS,
  searchResources,
} from "../components/Reentry/Resources/search/utils";
import { ResourceSummary } from "../components/Reentry/Resources/types";
import { useDebouncedValue } from "./useDebouncedValue";

const MAX_RESULTS = 20;

export const SEARCH_DEBOUNCE_MS = 500;

export type ResourceSearchResult = {
  results: ResourceSummary[];
  /** True while `results` still reflects a stale, pre-debounce query. */
  isQueryPending: boolean;
};

// As implemented in libs/@jii/states/US_NYC/src/hooks/useResourceSearch.ts
export function useResourceSearch(
  resources: ResourceSummary[],
  query: string,
  t: UsMaTFunction,
): ResourceSearchResult {
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // Building the Fuse index re-tokenizes every resource, so it's kept
  // separate from the query - it only needs to happen when the resource
  // list itself changes, not on every keystroke.
  const fuseIndex = useMemo(
    () => new Fuse(resources, SEARCH_OPTIONS),
    [resources],
  );

  const results = searchResources(
    resources,
    debouncedQuery,
    fuseIndex,
    t,
  ).slice(0, MAX_RESULTS);

  return { results, isQueryPending: query.trim() !== debouncedQuery.trim() };
}
