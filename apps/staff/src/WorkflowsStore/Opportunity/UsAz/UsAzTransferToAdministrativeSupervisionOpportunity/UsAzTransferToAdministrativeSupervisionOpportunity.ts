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

import { OpportunityRecordBase } from "~datatypes";
import { opportunitySchemaBase } from "~datatypes";

import { OPPORTUNITY_STATUS_COLORS } from "../../../../core/utils/workflowsUtils";
import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";

export class UsAzTransferToAdministrativeSupervisionOpportunity extends OpportunityBase<
  Client,
  OpportunityRecordBase
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usAzTransferToAdministrativeSupervision",
      client.rootStore,
      opportunitySchemaBase.parse(record),
    );
  }

  tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.almostEligible) return "Eligible per Initial Assessment";
    return "Eligible per ORAS";
  }

  eligibilityStatusLabel(): string {
    return this.tabTitle();
  }

  get customStatusPalette() {
    if (this.almostEligible) {
      return OPPORTUNITY_STATUS_COLORS.eligible;
    }
    return super.customStatusPalette;
  }
}
