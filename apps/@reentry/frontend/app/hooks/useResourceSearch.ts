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

import { useState } from "react";

import { mockResourceBank } from "../../tests/mocks/mockResourceBank";
import type { ResourceWithMeta } from "./resourceBank.types";

const MOCK_SEARCH_RESOURCES: ResourceWithMeta[] =
  mockResourceBank.resources_by_sections.flatMap(
    (section) => section.resources,
  );

const useResourceSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResourceWithMeta[] | null>(null);

  const search = async (
    category: string,
    subcategory: string,
    radiusMi: number,
  ): Promise<void> => {
    setIsLoading(true);

    const data = await Promise.resolve(
      MOCK_SEARCH_RESOURCES.filter((resource) => {
        if (resource.category !== category) return false;
        if (subcategory && resource.subcategory !== subcategory) return false;
        if (
          radiusMi &&
          resource.travel_distance_miles &&
          resource.travel_distance_miles > radiusMi
        )
          return false;
        return true;
      }),
    );

    setResults(data);
    setIsLoading(false);
  };

  return { isLoading, results, search };
};

export default useResourceSearch;
