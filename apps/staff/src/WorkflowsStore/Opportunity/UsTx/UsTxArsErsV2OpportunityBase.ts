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

import {
  OPPORTUNITY_STATUS_COLORS,
  StatusPalette,
} from "../../../core/utils/workflowsUtils";
import { getOfficerFullName } from "../../../core/WorkflowsOfficerName/getOfficerFullName";
import { OpportunityUpdateWithForm } from "../../../FirestoreStore";
import {
  formatWorkflowsDate,
  formatWorkflowsDateString,
} from "../../../utils/formatStrings";
import { Client } from "../../Client";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityTab } from "../types";

export abstract class UsTxArsErsV2OpportunityBase<
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdateWithForm<any>,
> extends OpportunityBase<Client, ReferralRecord, UpdateRecord> {
  get submittedForReviewDate(): string | undefined {
    if (!this.isInSupervisorReview && !this.isInRevisionsRequested) {
      return undefined;
    }

    if (this.isInRevisionsRequested) {
      return formatWorkflowsDate(
        this.latestAction?.supervisorResponse?.date.toDate(),
      );
    }

    return formatWorkflowsDate(this.latestAction?.date.toDate());
  }

  get allPreviousReviewers(): string[] {
    if (!this.actionHistory) {
      return [];
    }

    const {
      availableOfficers,
      searchStore: { searchType },
    } = this.rootStore.workflowsStore;

    return this.actionHistory
      .flatMap((action) => {
        const staffResponseId = action.supervisorResponse?.updateById;
        const staffRequestId = action.updateById;

        if (staffResponseId && staffRequestId) {
          return [
            getOfficerFullName(
              availableOfficers,
              staffRequestId,
              undefined,
              searchType,
            ) ?? staffRequestId,
            getOfficerFullName(
              availableOfficers,
              staffResponseId,
              undefined,
              searchType,
            ) ?? staffResponseId,
          ];
        }

        if (!staffRequestId || staffRequestId === "RECIDIVIZ") return action.by;
        return (
          getOfficerFullName(
            availableOfficers,
            staffRequestId,
            undefined,
            searchType,
          ) ?? staffRequestId
        );
      })
      .filter((name) => name !== undefined);
  }

  get isGrantApproved(): boolean {
    return !!this.record.metadata.grantedAt;
  }

  get grantDate(): string | undefined {
    if (!this.record.metadata.grantedAt) return undefined;
    return formatWorkflowsDateString(this.record.metadata.grantedAt);
  }

  get isInRevisionsRequested(): boolean {
    return (
      !!this.latestAction &&
      !this.latestAction.isStale &&
      this.latestAction.supervisorResponse?.type === "REVISION"
    );
  }

  get supervisorReviewTabTitle(): OpportunityTab {
    return "Submitted for Review";
  }

  get grantApprovedTabTitle(): OpportunityTab {
    return "Approved by Supervisor";
  }

  get grantApprovedStatusMessage(): string {
    return "Approved by Supervisor";
  }

  get customStatusPalette(): StatusPalette | undefined {
    if (this.isGrantApproved) return OPPORTUNITY_STATUS_COLORS.eligible;
    if (this.isInGrantReview || this.isInRevisionsRequested)
      return OPPORTUNITY_STATUS_COLORS.almostEligible;
    return undefined;
  }

  eligibilityStatusLabel(includeReasons?: boolean): string | null {
    if (this.isGrantApproved) return this.grantApprovedStatusMessage;
    if (this.isInRevisionsRequested) return "Awaiting Revisions";
    if (this.isInGrantReview) return this.supervisorReviewTabTitle;
    return super.eligibilityStatusLabel(includeReasons);
  }

  tabTitle(): OpportunityTab {
    // Snoozed tab
    if (this.denied) return this.deniedTabTitle;

    // Submitted for Review tab
    if (this.isInSupervisorReview) return this.supervisorReviewTabTitle;

    // Awaiting Revisions tab
    if (this.isInRevisionsRequested) return "Awaiting Revisions";

    // Approved tab
    if (this.isGrantApproved) return this.grantApprovedTabTitle;

    // Almost Eligible tab
    if (this.almostEligible) return "Almost Eligible";

    // Eligible Now tab
    return "Eligible Now";
  }
}
