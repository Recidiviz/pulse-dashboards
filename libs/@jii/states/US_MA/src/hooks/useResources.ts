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

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  useTypedParams,
  useTypedSearchParams,
} from "react-router-typesafe-routes/dom";

import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

import { parseSelectedFilters } from "../components/Reentry/Resources/filters/filterConfig";
import { matchesFilters } from "../components/Reentry/Resources/filters/matching";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Returns the MA resources in the route's category that match the filters in
 * the URL. MA has few enough resources that the page fetches them all once and
 * filters them in memory.
 */
export function useResources() {
  const {
    apiClient: { trpcQuerier },
  } = useRootStore();
  const { data } = useSuspenseQuery({
    ...trpcQuerier.resident.resources.getResources.queryOptions(),
    staleTime: ONE_HOUR_MS,
  });

  const route = State.Resident.UsMaReentry.Resources.CategoryResults;
  const { category } = useTypedParams(route);
  const [searchParams] = useTypedSearchParams(route);
  const selectedFilters = parseSelectedFilters(searchParams);

  return {
    // The route uses "housing" while the Resource API uses "Housing".
    resources: data.filter(
      (resource) =>
        resource.categories.some(
          (cat) => cat.category.toLowerCase() === category.toLowerCase(),
        ) && matchesFilters(resource, selectedFilters),
    ),
    selectedFilters,
  };
}
