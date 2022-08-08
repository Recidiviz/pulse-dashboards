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
  PENDING: "Overdue for early termination",
  IN_PROGRESS: "Early termination status in review",
  COMPLETED: "Paperwork completed and filed with Court",
  DENIED: "Currently ineligible",
  ALMOST: "Almost eligible",
};

export function formatNoteDate(date: Date): string {
  return format(date, "MMMM do");
}
