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

import { OpportunityTableColumnId } from "../../../../../../core/OpportunityCaseloadView/HydratedOpportunityPersonList";
import { OpportunityTab, OpportunityTabGroups } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsTxArsErsV2Configuration extends ApiOpportunityConfiguration {
  get enabledColumns(): Array<OpportunityTableColumnId> {
    const cols = [...super.enabledColumns];
    const colsToAdd: OpportunityTableColumnId[] = [
      "US_TX_CURRENT_REVIEWER",
      "US_TX_SUBMITTED_FOR_REVIEW_DATE",
      "US_TX_ALL_REVIEWERS",
      "US_TX_GRANT_DATE",
      "US_TX_REVISION_REASON",
    ].filter(
      (c) => !cols.includes(c as OpportunityTableColumnId),
    ) as OpportunityTableColumnId[];
    const colsToRemove: OpportunityTableColumnId[] = ["CTA_BUTTON"];
    return [...cols, ...colsToAdd].filter((c) => !colsToRemove.includes(c));
  }

  // TODO(#9880): Add custom denial reason snooze lengths to admin panel
  get maxSnoozeDaysByDenialReason(): Record<string, number | undefined> {
    return { ...super.maxSnoozeDaysByDenialReason, DISCRETION: 365 };
  }

  get markSubmittedOnFormDownload() {
    return false;
  }

  // Granted records (metadata.grantedAt set by ETL) have isEligible: false in
  // Firestore. We need to fetch them so the "Approved in OIMS" tab is populated
  // for 90 days after the opportunity is granted.
  get hydrateIneligibleRecordsInOpportunityManager() {
    return true;
  }

  get hidePreviewModal(): boolean {
    return true;
  }

  get enableSupervisorReviewChain(): boolean {
    return true;
  }

  get hideWorkflowsTabGroupSelector(): boolean {
    return true;
  }

  get supportsSupervisorReview(): boolean {
    return true;
  }

  get supervisorReviewTabTitle(): OpportunityTab {
    return "Submitted for Review";
  }

  get insightsSupervisorReviewTabTitle(): OpportunityTab {
    return "Awaiting Review";
  }

  get grantApprovedTabTitle(): OpportunityTab {
    return "Approved in OIMS";
  }

  // Adding this here as opposed to the admin panel since this gives us
  // 1 source of truth for the two (ARS and ERS) opportunities
  get tabGroups(): OpportunityTabGroups {
    return {
      "ELIGIBILITY STATUS": [
        "Eligible Now",
        "Almost Eligible",
        this.supervisorReviewTabTitle,
        this.awaitingRevisionsTabTitle,
        this.grantApprovedTabTitle,
        this.deniedTabTitle,
      ],
      "REVIEW STATUS": [
        this.insightsSupervisorReviewTabTitle,
        this.awaitingRevisionsTabTitle,
      ],
    };
  }
}
