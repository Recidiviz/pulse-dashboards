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

import {
  countSelectedOptions,
  getFilterGroups,
  parseSelectedFilters,
  toSearchParams,
} from "../components/Reentry/Resources/filters/filterConfig";
import { matchesFilters } from "../components/Reentry/Resources/filters/matching";
import { SelectedFilters } from "../components/Reentry/Resources/filters/types";

export const ONE_HOUR_MS = 60 * 60 * 1000;

export function useResources() {
  const {
    apiClient: { trpcQuerier },
    userStore: { segmentClient },
  } = useRootStore();
  const { data } = useSuspenseQuery({
    ...trpcQuerier.resident.resources.getResources.queryOptions(),
    staleTime: ONE_HOUR_MS,
  });

  const route = State.Resident.UsMaReentry.Resources.CategoryResults;
  const { category, personPseudoId } = useTypedParams(route);
  const [searchParams, setSearchParams] = useTypedSearchParams(route);

  const categoryResources = data.filter((resource) =>
    resource.categories.some(
      (cat) => cat.category.toLowerCase() === category.toLowerCase(),
    ),
  );
  const filterGroups = getFilterGroups(categoryResources, category);
  const appliedFilters = parseSelectedFilters(filterGroups, searchParams);

  return {
    resources: categoryResources.filter((resource) =>
      matchesFilters(resource, appliedFilters),
    ),
    appliedFilters,
    filterGroups,
    // Keeps search params that the filters don't use, such as tags.
    applyFilters: (filters: SelectedFilters) => {
      if (countSelectedOptions(filters) === 0) {
        segmentClient.trackCreFilterCleared({
          justiceInvolvedPersonPseudoId: personPseudoId,
          category,
        });
      } else {
        segmentClient.trackCreFiltersUpdated({
          justiceInvolvedPersonPseudoId: personPseudoId,
          category,
          filters: toSearchParams(filters),
        });
      }
      setSearchParams((current) => ({
        ...current,
        ...toSearchParams(filters),
      }));
    },
  };
}
