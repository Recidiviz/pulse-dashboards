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

import { palette } from "@recidiviz/design-system";
import { DocumentData } from "firebase/firestore";

import { OPPORTUNITY_STATUS_COLORS } from "../../../core/utils/workflowsUtils";
import { OpportunityUpdate } from "../../../FirestoreStore";
import { Resident } from "../../Resident";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityTab } from "../types";

export type UsAzTransitionProgramSubcategory =
  | "HOME_PLAN_IN_PROGRESS"
  | "AWAITING_HOME_PLAN_APPROVAL"
  | "AWAITING_RELEASE"
  | "PROJECTED_TPR_IN_LESS_THAN_180_DAYS"
  | "PROJECTED_TPR_IN_AT_LEAST_180_DAYS";

export type UsAzReleaseToTPRUpdateRecord = OpportunityUpdate & {
  subcategory: UsAzTransitionProgramSubcategory | undefined;
};

export abstract class UsAzReleaseToTransitionProgramOpportunityBase<
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdate,
> extends OpportunityBase<Resident, ReferralRecord, UpdateRecord> {
  get almostEligible() {
    return !!this.record.metadata.tabName?.startsWith("ALMOST_ELIGIBLE");
  }

  get tprDateInLessThan180Days(): boolean {
    return this.record.metadata.tabName === "ALMOST_ELIGIBLE_1";
  }

  tabTitle(): OpportunityTab {
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.almostEligible) return "Almost Eligible";
    switch (this.record.metadata.tabDescription) {
      case "FAST_TRACK":
        return "Fast Trackers";
      case "APPROVED_BY_TIME_COMP":
        return "Eligible Now";
      default:
        return "Other";
    }
  }

  get eligibleStatusMessage() {
    switch (this.record.metadata.tabDescription) {
      case "FAST_TRACK":
        return "Fast Tracker";
      default:
        return "Eligible";
    }
  }

  get almostEligibleStatusMessage() {
    if (!this.almostEligible) return;
    switch (this.record.metadata.tabDescription) {
      case "ALMOST_ELIGIBLE_MISSING_MANLIT_BETWEEN_7_AND_180_DAYS":
        return "Missing functional literacy requirement";
      case "ALMOST_ELIGIBLE_MISSING_CRITERIA_AND_BETWEEN_181_AND_365_DAYS":
        return "Missing criteria and date in >6 months";
      case "ALMOST_ELIGIBLE_BETWEEN_181_AND_365_DAYS":
        return "Date in >6 months";
      case "ALMOST_ELIGIBLE_BETWEEN_7_AND_180_DAYS":
        return "Date in less than 6 months";
      default:
        return "Almost eligible";
    }
  }

  get subcategory(): UsAzTransitionProgramSubcategory | undefined {
    if (this.isSubmitted) {
      return this.submittedUpdate
        ?.subcategory as UsAzTransitionProgramSubcategory;
    } else if (this.almostEligible) {
      if (this.tprDateInLessThan180Days) {
        return "PROJECTED_TPR_IN_LESS_THAN_180_DAYS";
      } else {
        return "PROJECTED_TPR_IN_AT_LEAST_180_DAYS";
      }
    } else {
      return undefined;
    }
  }

  get submittedSubcategories() {
    const possibleSubcategories = super.submittedSubcategories;
    // If the current opp is almost eligible, only "in progress" or "awaiting home plan
    // approval" are allowed depending on the subcategory
    if (this.almostEligible) {
      if (this.tprDateInLessThan180Days) {
        return possibleSubcategories?.filter(
          (cat) =>
            cat === "HOME_PLAN_IN_PROGRESS" ||
            cat === "AWAITING_HOME_PLAN_APPROVAL",
        );
      } else {
        return possibleSubcategories?.filter(
          (cat) => cat === "HOME_PLAN_IN_PROGRESS",
        );
      }
    } else {
      return possibleSubcategories;
    }
  }

  get customStatusPalette() {
    if (
      !this.isSubmitted &&
      !this.almostEligible &&
      this.record.metadata.tabDescription === "FAST_TRACK"
    ) {
      return {
        ...OPPORTUNITY_STATUS_COLORS.alert,
        text: palette.pine4,
        icon: palette.signal.highlight,
        buttonFill: palette.signal.links,
      };
    }

    return undefined;
  }
}
