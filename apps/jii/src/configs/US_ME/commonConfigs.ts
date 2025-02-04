// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { OpportunityConfig } from "../types";

export const defaultStatusLabels: OpportunityConfig["statusLabels"] = {
  ELIGIBLE: "May be eligible",
  ALMOST_ELIGIBLE: "Almost eligible",
  INELIGIBLE: "Not yet eligible",
  // Generally we don't expect this status to be displayed, but it's included
  // for completeness and as a fallback in case we do render it inadvertently
  NA: "Not available",
};

const eligibleDateReasonTemplate =
  "You'll meet this requirement on {{formatFullDate currentCriterion.eligibleDate}}";

export const commonTrackedCriteria = {
  usMeNoClassAOrBViolationFor90Days: {
    criterion: "No Class A or B discipline in past 90 days",
    ineligibleReason: `{{#if currentCriterion.eligibleDate}}
      ${eligibleDateReasonTemplate}
    {{else}}You have a Class {{currentCriterion.highestClassViol}} violation: {{currentCriterion.violType}}
    {{/if}}`,
  },
  usMeNoDetainersWarrantsOrOther: {
    criterion: "No unresolved detainers, warrants or pending charges",
  },
} satisfies OpportunityConfig["requirements"]["summary"]["trackedCriteria"];

export const ineligibleReasonEligibleDate = `{{#if currentCriterion.eligibleDate}}${eligibleDateReasonTemplate}{{/if}}`;
