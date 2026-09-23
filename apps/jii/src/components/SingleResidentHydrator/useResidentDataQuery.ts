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

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { DataAPI, useResidentsContext } from "~@jii/data";
import { findStateSchema } from "~@jii/schemas";
import { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";

export function useResidentDataQuery(
  pseudonymizedId: string,
  trpcQuerier: DataAPI["trpcQuerier"],
) {
  const {
    residentsStore: { stateCode },
  } = useResidentsContext();

  // memoized to prevent unnecessary re-parsing when re-rendering the same data
  const parseResidentSSD = useCallback(
    (data: JiiResidentAppRouterOutputs["resident"]["getResident"]) => {
      let validatedSSD;
      const ssdSchema = findStateSchema(stateCode);
      // SSD data may exist even if we don't have a schema for it;
      // we will discard that raw data rather than returning it
      if (ssdSchema) {
        validatedSSD = ssdSchema.parse(data.stateSpecificData);
      }
      return { ...data, stateSpecificData: validatedSSD };
    },
    [stateCode],
  );

  return useQuery(
    trpcQuerier.resident.getResident.queryOptions(
      {
        pseudonymizedId,
      },
      {
        select: parseResidentSSD,
      },
    ),
  );
}
