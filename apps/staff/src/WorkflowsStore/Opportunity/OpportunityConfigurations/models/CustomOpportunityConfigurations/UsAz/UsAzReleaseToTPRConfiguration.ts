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

import { OpportunityType } from "~datatypes";

import { OpportunityTab, OpportunityTabGroups } from "../../../../types";
import { UsAzTransitionProgramSubcategory } from "../../../../UsAz";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsAzReleaseToTPRConfiguration extends ApiOpportunityConfiguration {
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

  get nonOmsCriteriaHeader() {
    return "Other Considerations";
  }

  get nonOmsCriteria() {
    return [{ text: "Satisfactory progress with Corrections Plan" }];
  }

  get subcategoryHeadings(): Record<UsAzTransitionProgramSubcategory, string> {
    return {
      HOME_PLAN_IN_PROGRESS: "Home Plan in Progress",
      AWAITING_HOME_PLAN_APPROVAL: "Awaiting Home Plan Approval",
      AWAITING_RELEASE: "Awaiting Release",
      PROJECTED_TPR_IN_LESS_THAN_180_DAYS:
        "Projected TPR date in the next 6 months",
      PROJECTED_TPR_IN_AT_LEAST_180_DAYS:
        "Projected TPR date in 180 days or more",
    };
  }

  get subcategoryOrderings(): Record<
    string,
    UsAzTransitionProgramSubcategory[]
  > {
    return {
      Pending: [
        "HOME_PLAN_IN_PROGRESS",
        "AWAITING_HOME_PLAN_APPROVAL",
        "AWAITING_RELEASE",
      ],
      "Almost Eligible": [
        "PROJECTED_TPR_IN_LESS_THAN_180_DAYS",
        "PROJECTED_TPR_IN_AT_LEAST_180_DAYS",
      ],
    };
  }

  get markSubmittedOptionsByTab(): Record<
    string,
    UsAzTransitionProgramSubcategory[]
  > {
    const allPendingSubcategories: UsAzTransitionProgramSubcategory[] =
      this.subcategoryOrderings["Pending"] ?? [];

    return {
      "Fast Trackers": allPendingSubcategories,
      "Approved by Time Comp": allPendingSubcategories,
      Pending: allPendingSubcategories,
      "Almost Eligible": [
        "HOME_PLAN_IN_PROGRESS",
        "AWAITING_HOME_PLAN_APPROVAL",
      ],
    };
  }

  get submittedTabTitle(): OpportunityTab {
    return "Pending";
  }

  get tabPrefaceCopy() {
    return {
      "Fast Trackers":
        "Fast Tracker cases have a release date within the next 30 days. These release dates have been approved by Central Time Comp. CO IIIs should ensure that all of these inmates have a home plan submitted for approval and that all other release packet components are complete. Names are organized by soonest release date to farthest out.",
      "Approved by Time Comp":
        "This tab contains cases with a release date between 30 and 180 days from now. These release dates have been approved by Central Time Comp. CO IIIs should ensure that all of these inmates have a home plan submitted for approval and that all other release packet components are complete. Names are organized by soonest release date to farthest out.",
      "Almost Eligible":
        "This tab contains cases with projected release dates that have not yet been approved by Central Time Comp. The first section includes inmates who have a projected STP date within 6 months but who are missing Functional Literacy. The second section contains inmates who have a projected date beyond 180 days from now who might be missing one or more criteria for transition program release. This tab is intended to help CO IIIs prioritize release planning for people who might soon become eligible for release. Names are organized by soonest release date to farthest out.",
      Pending:
        "This tab contains cases that have been marked as in progress in one of the other tabs. This tab will automatically update if the inmate's status changes.",
    };
  }

  get linkedOverdueOpportunityType(): OpportunityType {
    return "usAzOverdueForACISTPR";
  }

  get overdueOpportunityCalloutCopy() {
    return "overdue for their STP date";
  }
}
