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

import { OpportunityRecordBase, opportunitySchemaBase } from "~datatypes";

import { OPPORTUNITY_STATUS_COLORS } from "../../../../core/utils/workflowsUtils";
import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";

export class UsNdTransferToMinFacilityOpportunity extends OpportunityBase<
  Resident,
  OpportunityRecordBase
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usNdTransferToMinFacility",
      resident.rootStore,
      opportunitySchemaBase.parse(record),
    );
  }

  tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.record.metadata.tabName === "REFERRAL_SUBMITTED")
      return "Referral Submitted";

    return super.tabTitle();
  }

  eligibilityStatusLabel(includeReasons?: boolean) {
    if (this.denied) return super.eligibilityStatusLabel(includeReasons);
    if (this.record.metadata.tabName === "REFERRAL_SUBMITTED")
      return "Referral Submitted";

    return super.eligibilityStatusLabel(includeReasons);
  }

  get customStatusPalette() {
    if (this.record.metadata.tabName === "REFERRAL_SUBMITTED") return OPPORTUNITY_STATUS_COLORS.submitted;
    return super.customStatusPalette
  }
}
