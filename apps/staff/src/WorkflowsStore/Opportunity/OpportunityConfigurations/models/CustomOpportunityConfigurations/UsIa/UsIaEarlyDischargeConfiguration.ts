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

import { DenialInputSettings } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsIaEarlyDischargeConfiguration extends ApiOpportunityConfiguration {
  enableProgressiveLoading = true;

  get markSubmittedOnFormDownload(): boolean {
    // IA ED has customized opportunity submission flow
    return false;
  }

  get maxSnoozeDaysByDenialReason(): Record<string, number | undefined> {
    let indefiniteSnoozes = {};
    if (this.userStore.activeFeatureVariants.indefiniteSnooze) {
      indefiniteSnoozes = {
        "INTERSTATE (IC-IN)": undefined,
        COURT: undefined,
      };
    }
    const snoozeLengthOverrides = {
      "FINES & FEES": 365,
      DENIED: 365,
      "INTERSTATE (IC-OUT)": 365,
    };

    return {
      ...super.maxSnoozeDaysByDenialReason,
      ...snoozeLengthOverrides,
      ...indefiniteSnoozes,
    };
  }

  get reasonsRequiringApproval() {
    return ["INTERSTATE (IC-IN)", "COURT"];
  }

  // TODO(#9611): Add "PUBLIC SAFETY RISK" mapping for action plan input
  get denialInputSettings(): Record<string, DenialInputSettings> {
    if (this.userStore.activeFeatureVariants.usIaFinesAndFees) {
      return {
        "FINES & FEES": {
          required: true,
          heading: "Remaining fees (COFO + Restitution):",
          placeholder: "Please enter the total amount of remaining fees",
          inputType: "number",
          minCharacters: 1,
          maxCharacters: 10,
          prefix: "$",
        },
      };
    } else {
      return {};
    }
  }
}
