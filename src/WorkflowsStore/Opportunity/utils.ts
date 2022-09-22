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

import {
  Opportunity,
  OPPORTUNITY_STATUS_RANKED,
  OpportunityStatus,
  OpportunityType,
} from "./types";

export function rankByReviewStatus(opp: Opportunity): number {
  return OPPORTUNITY_STATUS_RANKED.indexOf(opp.reviewStatus);
}

export const defaultOpportunityStatuses: Record<OpportunityStatus, string> = {
  PENDING: "Needs referral",
  DENIED: "Currently ineligible",
  COMPLETED: "Referral form complete",
  IN_PROGRESS: "Referral in progress",
  ALMOST: "Almost eligible",
};

export const earlyTerminationOpportunityStatuses: Record<
  OpportunityStatus,
  string
> = {
  PENDING: "Needs review",
  IN_PROGRESS: "Review in progress",
  COMPLETED: "Paperwork completed",
  DENIED: "Currently ineligible",
  ALMOST: "Almost eligible",
};

export const earnedDischargeOpportunityStatuses: Record<
  OpportunityStatus,
  string
> = {
  PENDING: "Needs review",
  IN_PROGRESS: "Earned discharge review in progress",
  COMPLETED: "Earned discharge paperwork complete",
  DENIED: "Currently ineligible",
  ALMOST: "Almost eligible",
};

export const LSUOpportunityStatuses: Record<OpportunityStatus, string> = {
  PENDING: "May be eligible",
  IN_PROGRESS: "LSU transfer chrono in progress",
  COMPLETED: "LSU transfer chrono complete",
  DENIED: "Currently ineligible",
  ALMOST: "Almost eligible",
};

export function formatNoteDate(date: Date): string {
  return format(date, "MMMM do");
}

export type OpportunityHeadersType = {
  text: string;
  highlightText: string;
  callToAction: string;
};

export const opportunityHeaders: Record<
  OpportunityType,
  OpportunityHeadersType
> = {
  compliantReporting: {
    text: "clients may be eligible for",
    highlightText: "Compliant Reporting",
    callToAction: "Review and refer eligible clients for Compliant Reporting.",
  },
  earlyTermination: {
    text: "clients may be eligible for",
    highlightText: "early termination",
    callToAction:
      "Review clients eligible for early termination and download the paperwork to file with the Court.",
  },
  earnedDischarge: {
    text: `clients may be eligible for`,
    highlightText: `earned discharge`,
    callToAction: `Review clients who may be eligible for Earned Discharge and complete the request form in CIS.`,
  },
  LSU: {
    text: `clients may be eligible for the`,
    highlightText: `Limited Supervision Unit`,
    callToAction: `Review clients who may be eligible for LSU and complete a pre-filled transfer chrono.`,
  },
};
