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

import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import type { RadiusOption } from "~@reentry/frontend/components/action-plan/resource-bank/categorySubcategoryMap";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import type { components } from "~@reentry/openapi-types";

import type { ResourceWithMeta } from "./resourceBank.types";

type ResourceCategory = components["schemas"]["ResourceCategory"];
type ResourceSubcategory = components["schemas"]["ResourceSubcategory"];

const useResourceSearch = (clientAddress: string) => {
  const { getAccessToken } = useAuth();
  const [results, setResults] = useState<ResourceWithMeta[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { mutateAsync: searchResources, isPending: isLoading } =
    $api.useMutation("post", "/resources");

  useEffect(() => {
    setResults(null);
  }, [clientAddress]);

  const search = async (
    category: ResourceCategory,
    subcategory: ResourceSubcategory,
    radiusMi: RadiusOption,
  ): Promise<void> => {
    if (!clientAddress) return;

    setSearchError(null);
    setResults(null);

    try {
      const result = await searchResources({
        body: {
          category,
          subcategory,
          address: clientAddress,
          distance_miles: radiusMi,
          travel_mode: "DRIVE",
          use_search: true,
          limit: 50,
          include_physical_resources: true,
          include_digital_resources: false,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (result.failure_reason === "api_error") {
        console.error("Resource search failed:", result.error_message);
        setSearchError("Search error.");
        return;
      }

      if (result.failure_reason === "partial_failure") {
        console.error(
          "Resource search partially failed; some sources are unavailable.",
        );
      }

      const partners = [...(result.resources ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      const local = [...(result.resources ?? [])].sort(
        (a, b) =>
          (a.travel_distance_miles ?? Infinity) -
          (b.travel_distance_miles ?? Infinity),
      );

      const sorted = [...partners, ...local];
      setResults(sorted as ResourceWithMeta[]);
    } catch (e) {
      console.error("Resource search failed:", e);
      setSearchError("Search error.");
    }
  };

  return { searchError, isLoading, results, search };
};

export default useResourceSearch;
