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

import { useRootStore } from "~@jii/data";

import { buildCategoryGrid, getSimilarResources } from "./utils";

const ONE_HOUR_MS = 60 * 60 * 1000;

export function useResources() {
  const {
    apiClient: { trpcQuerier },
  } = useRootStore();

  const query = useSuspenseQuery({
    ...trpcQuerier.resident.resources.getResources.queryOptions(),
    staleTime: ONE_HOUR_MS,
  });

  const { data } = query;
  const { helpCategories, demographicCategories } = buildCategoryGrid(data);

  return {
    ...query,
    hasResources: helpCategories.length > 0 || demographicCategories.length > 0,
    helpCategories,
    demographicCategories,
    getSimilarResources: (category: string, currentOrganizationId: number) =>
      getSimilarResources(data, category, currentOrganizationId),
  };
}
