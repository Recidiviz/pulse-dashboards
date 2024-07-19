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

import { SortParamObject } from "../OpportunityConfigs";
import {
  Opportunity,
  OPPORTUNITY_STATUS_RANKED,
  PRIORITY_STATUS_RANKED,
} from "../types";

const RANKING_OVERRIDES = {
  reviewStatus: OPPORTUNITY_STATUS_RANKED,
  priority: PRIORITY_STATUS_RANKED,
};

type SortParam = SortParamObject<string>;

/**
 * Creates a sort function that sorts two opportunities by the provided sort fields. If the sort direction is not provided, it defaults to ascending.
 * @param sortFields members of the Opportunity or a JusticeInvolvedPerson class that the Opportunity is sorted by (defaults to undefined, if not found)
 * @returns sort function for Opportunity
 */
export function buildOpportunityCompareFunction(sortFields: SortParam[]) {
  return (a: Opportunity, b: Opportunity) => {
    return sortFields.reduce((result, sortParam) => {
      if (result === 0) {
        const {
          field,
          sortDirection = "asc",
          undefinedBehavior = "undefinedLast",
        } = sortParam;
        /**
         * Explicitly check for membership in `Opportunity` and `JusticeInvolvedPerson` classes.
         * @param o OpportunityBase instance
         * @param f sorting field to check for
         * @returns value at the `f` if it exists, otherwise `undefined`
         */
        const getProperty = (o: Opportunity, f: string) => {
          if (f in o) return o[f as keyof typeof o];
          if (f in o.person) return o.person[f as keyof typeof o.person];
          return undefined;
        };

        /**
         * Calculates the rank of the given opportunity given `f`.
         * @param opportunity OpportunityBase instance
         * @returns rank of the given opportunity. However, if an undefined behavior is provided, it will return -Infinity or Infinity based on the behavior.
         */
        const getRank = (opportunity: Opportunity) => {
          const propertyValue = getProperty(opportunity, field);
          if (propertyValue === undefined && undefinedBehavior) {
            if (undefinedBehavior === "undefinedFirst")
              return sortDirection === "desc" ? Infinity : -Infinity;
            if (undefinedBehavior === "undefinedLast")
              return sortDirection === "asc" ? Infinity : -Infinity;
          }
          return (
            (
              RANKING_OVERRIDES[field as keyof typeof RANKING_OVERRIDES] as
                | Readonly<Array<string>>
                | undefined
            )?.indexOf(propertyValue) ?? propertyValue
          );
        };

        const aRank = getRank(a);
        const bRank = getRank(b);

        return sortDirection === "desc"
          ? descending(aRank, bRank)
          : ascending(aRank, bRank);
      }
      return result;
    }, 0);
  };
}
