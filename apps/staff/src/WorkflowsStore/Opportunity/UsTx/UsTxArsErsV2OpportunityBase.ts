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
import { OpportunityTab, OpportunityTabGroup } from "../types";

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
      availableOfficersWithOrWithoutCaseloads,
      searchStore: { searchType },
    } = this.rootStore.workflowsStore;

    return [
      ...new Set(
        this.actionHistory
          .flatMap((action) => {
            const staffResponseId = action.supervisorResponse?.updateById;
            const staffRequestId = action.updateById;

            // updateById holds a stable staff external ID, which must not be
            // shown to users, so an unmatched ID falls back to action.by
            if (staffResponseId && staffRequestId) {
              return [
                getOfficerFullName(
                  availableOfficersWithOrWithoutCaseloads,
                  staffRequestId,
                  undefined,
                  searchType,
                  "stableStaffExternalId",
                ) ?? action.by,
                getOfficerFullName(
                  availableOfficersWithOrWithoutCaseloads,
                  staffResponseId,
                  undefined,
                  searchType,
                  "stableStaffExternalId",
                ) ?? action.supervisorResponse?.by,
              ];
            }

            if (!staffRequestId || staffRequestId === "RECIDIVIZ")
              return action.by;
            return (
              getOfficerFullName(
                availableOfficersWithOrWithoutCaseloads,
                staffRequestId,
                undefined,
                searchType,
                "stableStaffExternalId",
              ) ?? action.by
            );
          })
          .filter((name) => name !== undefined),
      ),
    ];
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
    return "Approved in OIMS";
  }

  get grantApprovedStatusMessage(): string {
    return "Approved in OIMS";
  }

  get customStatusPalette(): StatusPalette | undefined {
    if (this.isGrantApproved) return OPPORTUNITY_STATUS_COLORS.eligible;
    if (this.isInSupervisorReview || this.isInRevisionsRequested)
      return OPPORTUNITY_STATUS_COLORS.almostEligible;
    return undefined;
  }

  /**
   * Returns whether the selected staff is not this opportunity's current reviewer.
   */
  private isPastReviewFor(
    reviewerId: string | undefined,
    legacyReviewerId: string | undefined,
  ): boolean {
    if (!reviewerId && !legacyReviewerId) return false;
    const { currentReviewerId } = this;
    if (!currentReviewerId) return true;
    return (
      currentReviewerId !== reviewerId &&
      // TODO(OBT-53651): Remove once reviewer fields are migrated to stable IDs.
      currentReviewerId !== legacyReviewerId
    );
  }

  eligibilityStatusLabel(
    includeReasons?: boolean,
    category?: OpportunityTabGroup,
    reviewerId?: string,
    legacyReviewerId?: string,
  ): string | null {
    if (this.isGrantApproved) return this.grantApprovedStatusMessage;

    // TODO (OBT-39704) Refactor OpportunityTabGroup to enums
    // Use historical label if opportunity is under review
    // but selected supervisor is not the current reviewer
    if (
      category === "REVIEW STATUS" &&
      this.isPastReviewFor(reviewerId, legacyReviewerId)
    ) {
      return this.config.historicalReviewTabTitle;
    }

    // Snoozed tab
    if (this.denied) return "Currently ineligible";

    if (this.isInRevisionsRequested)
      return this.config.awaitingRevisionsTabTitle;

    if (this.isInSupervisorReview) {
      // TODO (OBT-39704) Refactor OpportunityTabGroup to enums
      return category === "REVIEW STATUS" &&
        this.config.insightsSupervisorReviewTabTitle
        ? this.config.insightsSupervisorReviewTabTitle
        : this.supervisorReviewTabTitle;
    }

    return super.eligibilityStatusLabel(includeReasons, category);
  }

  tabTitle(
    category?: OpportunityTabGroup,
    reviewerId?: string,
    legacyReviewerId?: string,
  ): OpportunityTab {
    // Approved tab
    if (this.isGrantApproved) return this.grantApprovedTabTitle;

    // Submitted for Review tab in REVIEW STATUS
    if (
      category === "REVIEW STATUS" &&
      this.isPastReviewFor(reviewerId, legacyReviewerId)
    ) {
      return this.config.historicalReviewTabTitle;
    }

    // Snoozed tab
    if (this.denied) return this.deniedTabTitle;

    // Awaiting Revisions tab
    if (this.isInRevisionsRequested)
      return this.config.awaitingRevisionsTabTitle;

    // Submitted for Review tab in ELIGIBILITY STATUS, Awaiting Review tab in
    // REVIEW STATUS
    if (this.isInSupervisorReview) {
      // TODO (OBT-39704) Refactor OpportunityTabGroup to enums
      return category === "REVIEW STATUS" &&
        this.config.insightsSupervisorReviewTabTitle
        ? this.config.insightsSupervisorReviewTabTitle
        : this.supervisorReviewTabTitle;
    }

    // Almost Eligible tab
    if (this.almostEligible) return "Almost Eligible";

    // Eligible Now tab
    return "Eligible Now";
  }
}
