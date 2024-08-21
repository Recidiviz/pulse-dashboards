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

import { pluralizeWord } from "../../../utils";
import { Opportunity } from "..";

export const generateOpportunityInitialHeader = (
  label: string,
  justiceInvolvedPersonTitle: string,
  workflowsSearchFieldTitle: string,
): string => {
  return `Search for ${pluralizeWord(
    workflowsSearchFieldTitle,
  )} above to review and refer eligible ${pluralizeWord(
    justiceInvolvedPersonTitle,
  )} for ${label.toLowerCase()}.`;
};

/**
 * This counts the number of opportunities in a list using the default counting algorithm if there is not one defined for the opportunityType.
 * @param opportunities list of opportunities
 * @returns number of opportunities according to counting algorithm
 */
export const countOpportunities = (opportunities: Opportunity[]): number => {
  if (opportunities.length === 0) return 0;
  const opportunityType = opportunities[0].type;
  opportunities.every((opportunity) => {
    const { type } = opportunity;
    if (type !== opportunityType)
      throw new Error(
        `Found unexpected opportunity of type "${type}" when expecting only "${opportunityType}" in list`,
      );
    return true;
  });

  const countByFunction = opportunities[0].config.countByFunction;
  const count = countByFunction
    ? countByFunction(opportunities)
    : opportunities.filter(
        (opp) => opp.reviewStatus !== "DENIED" && !opp.denial,
      ).length;
  return count;
};
