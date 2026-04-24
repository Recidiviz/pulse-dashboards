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

import { OpportunityTab } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsNcCreditReductionReviewConfiguration extends ApiOpportunityConfiguration {
  get markSubmittedOnFormDownload(): boolean {
    return false;
  }

  get sidebarComponents(): string[] {
    return [...super.sidebarComponents, "actionHistory"];
  }

  get supportsSupervisorReviewOnGrants(): boolean {
    return !!this.userStore.activeFeatureVariants.usNcCrrApprovalFlow;
  }

  get supervisorReviewTabTitle(): OpportunityTab {
    return "Submitted for Chief Review";
  }

  get grantApprovedTabTitle(): OpportunityTab {
    return "Approved by Chief";
  }

  get grantApprovedStatusMessage(): string {
    return "Approved by Chief";
  }

  get grantReviewDropdownLabel(): string {
    return "Submit for Chief Review";
  }
}
