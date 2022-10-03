// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { format } from "date-fns";
import simplur from "simplur";

import {
  Opportunity,
  OPPORTUNITY_STATUS_RANKED,
  OpportunityType,
} from "./types";

export function rankByReviewStatus(opp: Opportunity): number {
  return OPPORTUNITY_STATUS_RANKED.indexOf(opp.reviewStatus);
}

export function formatNoteDate(date: Date): string {
  return format(date, "MMMM do");
}

export type OpportunityHeadersType = {
  eligibilityText: string;
  opportunityText: string;
  callToAction: string;
};

export const generateOpportunityHeader = (
  opportunityType: OpportunityType,
  count: number
): OpportunityHeadersType => {
  const headers = {
    compliantReporting: {
      eligibilityText: simplur`${count} client[|s] may be eligible for`,
      opportunityText: "Compliant Reporting",
      callToAction:
        "Review and refer eligible clients for Compliant Reporting.",
    },
    earlyTermination: {
      eligibilityText: simplur`${count} client[|s] may be eligible for`,
      opportunityText: "early termination",
      callToAction:
        "Review clients eligible for early termination and download the paperwork to file with the Court.",
    },
    earnedDischarge: {
      eligibilityText: simplur`${count} client[|s] may be eligible for`,
      opportunityText: `earned discharge`,
      callToAction: `Review clients who may be eligible for Earned Discharge and complete the request form in CIS.`,
    },
    LSU: {
      eligibilityText: simplur`${count} client[|s] may be eligible for the`,
      opportunityText: `Limited Supervision Unit`,
      callToAction: `Review clients who may be eligible for LSU and complete a pre-filled transfer chrono.`,
    },
    pastFTRD: {
      eligibilityText: simplur`${count} client[|s] ha[s|ve]`,
      opportunityText: "passed their full-term release date",
      callToAction:
        "Review clients who are past their full-term release date and email clerical to move them to history.",
    },
  };

  return headers[opportunityType];
};
