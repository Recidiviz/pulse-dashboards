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

import { OpportunityType } from "~datatypes";

import { Opportunity } from "../../../WorkflowsStore";
import { Resident } from "../../../WorkflowsStore/Resident";

export const US_TN_CLASSIFICATION_OPPORTUNITIES = [
  "usTnAnnualReclassification2026Policy",
  "usTnCustodyLevelDowngrade2026Policy",
  "usTnInitialClassification2026Policy",
  "usTnSpecialCustodyLevelUpgrade2026Policy",
] satisfies OpportunityType[];

export function usTnPrioritizedOpportunity(
  resident: Resident,
): Opportunity | undefined {
  const { opportunities } = resident;

  const relevantOpps = US_TN_CLASSIFICATION_OPPORTUNITIES.map((oppType) => {
    return opportunities[oppType]?.[0];
  }).filter((x) => x !== undefined);

  // Given how these opportunities overlap, we expect users
  // to only have someone be in progress for at most one opportunity
  const inProgress = relevantOpps.find((opp) => opp.isSubmitted);

  if (inProgress) {
    return inProgress;
  }

  // The queries are written such that someone will be eligible
  // for at most one of these four opportunities
  return relevantOpps.find((opp) => opp.isEligible);
}
