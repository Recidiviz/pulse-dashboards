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

import { DocumentData } from "firebase/firestore";

import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";
import {
  UsAzTransferToAdministrativeSupervisionReferralRecord,
  usAzTransferToAdministrativeSupervisionSchema,
} from "./UsAzTransferToAdministrativeSupervisionReferralRecord";

export class UsAzTransferToAdministrativeSupervisionOpportunity extends OpportunityBase<
  Resident,
  UsAzTransferToAdministrativeSupervisionReferralRecord
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usAzTransferToAdministrativeSupervision",
      resident.rootStore,
      usAzTransferToAdministrativeSupervisionSchema.parse(record),
    );
  }

  tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (
      this.record.metadata.tabDescription !== "MAYBE_ELIGIBLE" &&
      this.almostEligible
    )
      return "Almost Eligible";
    return "Eligible Now";
  }

  eligibilityStatusLabel(includeReasons?: boolean): string | null {
    // For MAYBE_ELIGIBLE cases, show "May be eligible" instead of "Almost eligible"
    if (
      this.almostEligible &&
      this.record.metadata.tabDescription === "MAYBE_ELIGIBLE"
    ) {
      return "May be eligible";
    }

    // For all other cases, use the parent class logic
    return super.eligibilityStatusLabel(includeReasons);
  }

  get subcategory(): string | undefined {
    if (this.isSubmitted || this.denied) return;
    switch (this.record.metadata.tabDescription) {
      case "MAYBE_ELIGIBLE":
      case "NOT_MAYBE_ELIGIBLE":
        return this.record.metadata.tabDescription;
      default:
        return;
    }
  }
}
