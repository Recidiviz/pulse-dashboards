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

import { DocumentData } from "firebase/firestore";

import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";
import {
  UsMiCustodyLevelDowngradeReferralRecord,
  usMiCustodyLevelDowngradeSchema,
} from "./UsMiCustodyLevelDowngradeReferralRecord";

export class UsMiCustodyLevelDowngradeOpportunity extends OpportunityBase<
  Resident,
  UsMiCustodyLevelDowngradeReferralRecord
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMiCustodyLevelDowngrade",
      resident.rootStore,
      usMiCustodyLevelDowngradeSchema.parse(record),
    );
  }

  get submittedButtonText(): string {
    return "Move to Needs Re-Screen";
  }

  get undoSubmittedButtonText(): string {
    return "Revert from Needs Re-Screen";
  }

  get subcategory() {
    if (this.isSubmitted) {
      if (this.submittedUpdate?.subcategory) {
        return this.submittedUpdate?.subcategory;
      }

      const submittedOptions =
        this.config.markSubmittedOptionsByTab?.[this.tabTitle()];
      // Return the last option in the array, if any
      return submittedOptions?.[submittedOptions.length - 1] ?? undefined;
    }

    if (this.tabTitle() === "Needs Review") {
      if (this.almostEligible) return "ALMOST_ELIGIBLE_FOR_REVIEW";
      return "ELIGIBLE_FOR_REVIEW";
    }
  }

  tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.record.metadata.tabName === "ELIGIBLE_FOR_MOVEMENT") {
      return "Transfer in Progress";
    }
    if (
      this.record.metadata.tabName === "ELIGIBLE_FOR_ASSESSMENT" ||
      this.record.isEligible ||
      this.almostEligible
    ) {
      return "Needs Review";
    }
    return super.tabTitle();
  }
}
