// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";

export class UsAzTransferToAdministrativeSupervisionV2Opportunity extends OpportunityBase<
  Client,
  OpportunityRecordBase
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usAzTransferToAdministrativeSupervisionV2",
      client.rootStore,
      opportunitySchemaBase.parse(record),
    );
  }

  tabTitle(): OpportunityTab {
    if (this.denied || this.isSupervisorGrantDenied) return this.deniedTabTitle;
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.isInSupervisorReview) return this.supervisorReviewTabTitle;
    if (this.isGrantApproved) return this.grantApprovedTabTitle;
    return "Eligible per ORAS";
  }

  get isSupervisorGrantDenied(): boolean {
    return (
      !!this.latestAction &&
      !this.latestAction.isStale &&
      this.latestAction.type === "APPROVAL" &&
      this.latestAction.supervisorResponse?.type === "DENIAL"
    );
  }

  eligibilityStatusLabel(): string {
    return this.tabTitle();
  }

  get customStatusPalette() {
    return super.customStatusPalette;
  }
}
