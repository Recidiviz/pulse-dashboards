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

import { OpportunityTabGroups } from "../../../../types";
import { UsAzTransitionProgramSubcategory } from "../../../../UsAz";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsAzReleaseToTPRConfiguration extends ApiOpportunityConfiguration {
  get denialReasons() {
    return {};
  }

  get tabGroups() {
    return {
      "ELIGIBILITY STATUS": [
        "Fast Trackers",
        "Approved by Time Comp",
        "Almost Eligible",
        "Pending",
      ],
    } as OpportunityTabGroups;
  }

  get nonOMSCriteriaHeader() {
    return "Other Considerations";
  }

  get nonOMSCriteria() {
    return [{ text: "Satisfactory progress with Corrections Plan" }];
  }

  get subcategoryHeadings(): Record<UsAzTransitionProgramSubcategory, string> {
    return {
      HOME_PLAN_IN_PROGRESS: "Home plan in progress",
      AWAITING_HOME_PLAN_APPROVAL: "Awaiting home plan approval",
      AWAITING_RELEASE: "Awaiting release",
      PROJECTED_TPR_IN_LESS_THAN_180_DAYS:
        "Projected TPR date in the next 6 months",
      PROJECTED_TPR_IN_AT_LEAST_180_DAYS:
        "Projected TPR date in 180 days or more",
    };
  }
}
