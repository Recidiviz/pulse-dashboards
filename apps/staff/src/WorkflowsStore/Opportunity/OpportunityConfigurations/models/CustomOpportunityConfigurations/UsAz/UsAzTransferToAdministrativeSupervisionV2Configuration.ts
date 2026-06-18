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

import { countBy } from "lodash";

import type { PartialRecord } from "../../../../../../utils/typeUtils";
import type {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroups,
} from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsAzTransferToAdministrativeSupervisionV2Configuration extends ApiOpportunityConfiguration {
  countByFunction = (opportunities: Opportunity[]) => {
    const counts = countBy(opportunities, (opp) =>
      opp.tabTitle(),
    ) as PartialRecord<OpportunityTab, number>;
    return counts["Eligible per ORAS"] ?? 0;
  };

  get customSubmittedText(): string {
    return "Don't forget to remove them from the [drug testing schedule](https://aversys.averhealth.com).";
  }

  get supportsSupervisorReviewOnGrants(): boolean {
    return !!this.userStore.activeFeatureVariants
      .usAzAdminSupervisionApprovalFlow;
  }

  get supervisorReviewTabTitle(): OpportunityTab {
    return "Submitted for Supervisor Review";
  }

  get grantApprovedTabTitle(): OpportunityTab {
    return "Approved by Supervisor";
  }

  get grantApprovedStatusMessage(): string {
    return "Approved by Supervisor";
  }

  get grantReviewDropdownLabel(): string {
    return "Submit for Supervisor Approval";
  }

  get tabGroups(): OpportunityTabGroups {
    if (!this.supportsSupervisorReviewOnGrants) {
      return {
        "ELIGIBILITY STATUS": [
          "Eligible per ORAS",
          this.submittedTabTitle,
          this.deniedTabTitle,
        ],
      };
    }
    return {
      "ELIGIBILITY STATUS": [
        "Eligible per ORAS",
        this.supervisorReviewTabTitle,
        this.grantApprovedTabTitle,
        this.submittedTabTitle,
        this.deniedTabTitle,
      ],
    };
  }
}
