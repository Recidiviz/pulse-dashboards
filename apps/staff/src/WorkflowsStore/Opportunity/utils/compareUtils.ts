// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ascending, descending } from "d3-array";

import { Opportunity, OPPORTUNITY_STATUS_RANKED } from "../types";

const RANKING_OVERRIDES = {
  reviewStatus: OPPORTUNITY_STATUS_RANKED,
} as const;

type SortParam = `${string} asc` | `${string} desc` | string;

/**
 * Creates a sort function that sorts two opportunities by the provided sort fields. If the sort direction is not provided, it defaults to ascending.
 * @param sortFields members of the Opportunity or a JusticeInvolvedPerson class that the Opportunity is sorted by (defaults to undefined, if not found)
 * @returns sort function for Opportunity
 */
export function buildOpportunityCompareFunction(sortFields: SortParam[]) {
  return (a: Opportunity, b: Opportunity) => {
    return sortFields.reduce((result, field) => {
      if (result === 0) {
        const parsedSortFields = field.split(" ") as
          | [string, string]
          | [string];
        const [sortField, sortDirection] = parsedSortFields;
        const rankingOverride =
          RANKING_OVERRIDES[sortField as keyof typeof RANKING_OVERRIDES];

        const getProperty = (f: any, o: Opportunity) => {
          if (Object.hasOwn(o, f)) return o[f as keyof typeof o];
          if (Object.hasOwn(o.person, f))
            return o.person[f as keyof typeof o.person];
          return undefined;
        };

        const getRank = (o: Opportunity) =>
          getProperty(sortField, o) && rankingOverride
            ? rankingOverride.indexOf(getProperty(sortField, o))
            : getProperty(sortField, o);

        return !sortDirection || sortDirection === "asc"
          ? ascending(getRank(a), getRank(b))
          : descending(getRank(a), getRank(b));
      }
      return result;
    }, 0);
  };
}
