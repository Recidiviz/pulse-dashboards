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

import { DocumentData } from "@google-cloud/firestore";
import { Timestamp } from "firebase/firestore";
import { intersection, pick } from "lodash";

import { OPPORTUNITY_STATUS_COLORS } from "../../../../core/utils/workflowsUtils";
import { workflowsUrl } from "../../../../core/views";
import {
  OfficerApprovalAction,
  OfficerDenialAction,
  SupervisorAction,
} from "../../../../FirestoreStore";
import { UsIaEarlyDischargeActionsMetadata } from "../../../../RootStore/AnalyticsStore/AnalyticsStore";
import { Client } from "../../../Client";
import { UsIaEarlyDischargeForm } from "../../Forms/UsIaEarlyDischargeForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  ActedOnTextAddition,
  OpportunityBannerInfo,
  OpportunityRequirement,
  OpportunityTab,
  RevertConfirmationCopy,
} from "../../types";
import { RELEVANT_ED_DENIAL_REASONS } from "..";
import { UsIaSupervisionLevelDowngradeOpportunity } from "../UsIaSupervisionLevelDowngradeOpportunity";
import { UsIaEarlyDischargeClientStatus } from "./types";
import {
  UsIaEarlyDischargeReferralRecord,
  usIaEarlyDischargeSchema,
} from "./UsIaEarlyDischargeOpportunitySchema";

export const PUBLIC_SAFETY_KEY = "PUBLIC SAFETY";

export class UsIaEarlyDischargeOpportunity extends OpportunityBase<
  Client,
  UsIaEarlyDischargeReferralRecord
> {
  form?: UsIaEarlyDischargeForm = undefined;

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usIaEarlyDischarge",
      client.rootStore,
      usIaEarlyDischargeSchema.parse(record),
    );

    const {
      workflowsStore: {
        featureVariants: { usIaEarlyDischargeForms },
      },
    } = client.rootStore;

    if (usIaEarlyDischargeForms) {
      this.form = new UsIaEarlyDischargeForm(this, client.rootStore);
    }
  }

  requiresRevertConfirmation = true;

  revertConfirmationCopy: RevertConfirmationCopy = {
    headerText: "Are you sure you want to revert all changes?",
    descriptionText:
      "Reverting all changes will delete any action plans and notes connected to this client. Client will be placed in the Eligible Now tab.",
  };

  get userName(): string {
    // We'll fall back to the user's email
    return this.rootStore.userStore.userFullName ?? this.currentUserEmail;
  }

  get mostRecentActions() {
    return this.actionHistory?.slice(-2);
  }

  get clientStatus(): UsIaEarlyDischargeClientStatus {
    const officerAction = this.latestAction;
    const supervisorResponse = officerAction?.supervisorResponse;

    if (this.denied) {
      return "DENIED";
    }

    if (this.isSubmitted) {
      return "SUBMITTED";
    }

    if (!officerAction || officerAction.isStale) return "ELIGIBLE_NOW";

    // A discharge request has been submitted
    if (officerAction.type === "APPROVAL" && !supervisorResponse)
      return "DISCHARGE_FORM_REVIEW";

    // A denial request has been submitted
    if (officerAction.type === "DENIAL" && !supervisorResponse)
      return officerAction.denialReasons.includes(PUBLIC_SAFETY_KEY)
        ? "ACTION_PLAN_REVIEW"
        : "SNOOZE_REVIEW";

    // A discharge request has been approved
    if (
      officerAction.type === "APPROVAL" &&
      supervisorResponse?.type === "APPROVAL"
    )
      return "READY_FOR_DISCHARGE";

    // A discharge request has been approved
    if (
      officerAction.type === "APPROVAL" &&
      supervisorResponse?.type === "APPROVAL"
    )
      return "READY_FOR_DISCHARGE";

    // A denial request has been denied
    if (
      officerAction.type === "DENIAL" &&
      supervisorResponse?.type === "DENIAL"
    )
      return "ACTION_PLAN_REVIEW_REVISION";

    // A discharge request has been denied - with the current opportunity lifecycle,
    // this state should be unreachable.
    if (
      officerAction.type === "APPROVAL" &&
      supervisorResponse?.type === "DENIAL"
    )
      throw new Error(
        "Expected to be unreachable state. A discharge request was denied without creating a new denial request or action being marked stale.",
      );

    return "ELIGIBLE_NOW";
  }

  get eligibleStatusMessage(): string | undefined {
    if (this.clientStatus === "READY_FOR_DISCHARGE") {
      return "Ready for Discharge";
    }
    if (
      this.clientStatus === "ACTION_PLAN_REVIEW" ||
      this.clientStatus === "ACTION_PLAN_REVIEW_REVISION"
    ) {
      return "Action Plan Review";
    }
    if (this.clientStatus === "DISCHARGE_FORM_REVIEW") {
      return "Discharge Form Review";
    }
    if (this.clientStatus === "SNOOZE_REVIEW") {
      return "Indefinite Snooze Review";
    }

    return "Eligible Now";
  }

  get customStatusPalette() {
    if (
      this.clientStatus === "ACTION_PLAN_REVIEW" ||
      this.clientStatus === "ACTION_PLAN_REVIEW_REVISION"
    ) {
      return OPPORTUNITY_STATUS_COLORS.almostEligible;
    }
    if (this.clientStatus === "DISCHARGE_FORM_REVIEW") {
      return OPPORTUNITY_STATUS_COLORS.submitted;
    }
  }

  tabTitle(): OpportunityTab {
    switch (this.clientStatus) {
      case "DENIED":
        return this.deniedTabTitle;
      case "SUBMITTED":
        return this.submittedTabTitle;
      case "ACTION_PLAN_REVIEW_REVISION":
        return "Revisions Requests";
      case "ACTION_PLAN_REVIEW":
      case "SNOOZE_REVIEW":
      case "DISCHARGE_FORM_REVIEW":
        return "Supervisor Review";
      case "READY_FOR_DISCHARGE":
        return "Ready for Discharge";
      default:
        return "Eligible Now";
    }
  }

  async setOfficerAction(
    officerActionParams: OfficerApprovalAction | OfficerDenialAction,
  ): Promise<void> {
    const officerAction = {
      date: Timestamp.fromDate(new Date()),
      by: this.userName,
      isStale: false,
      ...officerActionParams,
    };
    const updatedActionHistory = (this.actionHistory ?? []).concat(
      officerAction,
    );

    const { userPseudoId } = this.rootStore.userStore;

    const actionMetadata: UsIaEarlyDischargeActionsMetadata["action"] =
      officerAction.type === "DENIAL"
        ? {
            type: officerAction.type,
            actionPlan: officerAction.actionPlan,
          }
        : { type: officerAction.type, additionalNotes: officerAction.notes };

    const originalStatus = this.clientStatus;

    await this.rootStore.firestoreStore.updateOpportunityActionHistory(
      this,
      updatedActionHistory,
    );

    this.rootStore.analyticsStore.trackUsIaEarlyDischargeOpportunityActions({
      staffId: userPseudoId ?? this.currentUserEmail,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      action: actionMetadata,
      currentStatus: originalStatus,
      subsequentStatus: this.clientStatus,
    });
  }

  async setSupervisorResponse(
    supervisorResponseParams: Omit<SupervisorAction, "date" | "by">,
  ): Promise<void> {
    const supervisorResponse = {
      date: Timestamp.fromDate(new Date()),
      by: this.userName,
      ...supervisorResponseParams,
    };

    if (!this.actionHistory || !this.latestAction) {
      throw new Error(
        `Supervisor cannot respond when there is no existing Action History`,
      );
    }

    const updatedOfficerAction = {
      ...this.latestAction,
      supervisorResponse,
    };

    const updatedActionHistory = this.actionHistory
      .slice(0, -1)
      .concat(updatedOfficerAction);

    const { userPseudoId } = this.rootStore.userStore;
    const actionMetadata: UsIaEarlyDischargeActionsMetadata["action"] = {
      type: this.latestAction.type,
      supervisorResponseType: supervisorResponse.type,
      revisionRequest: supervisorResponse.revisionRequest,
    };

    const originalStatus = this.clientStatus;

    await this.rootStore.firestoreStore.updateOpportunityActionHistory(
      this,
      updatedActionHistory,
    );

    this.rootStore.analyticsStore.trackUsIaEarlyDischargeOpportunityActions({
      staffId: userPseudoId ?? this.currentUserEmail,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      action: actionMetadata,
      currentStatus: originalStatus,
      subsequentStatus: this.clientStatus,
    });
  }

  async deleteActionHistory(): Promise<void> {
    const { userPseudoId } = this.rootStore.userStore;
    const actionMetadata: UsIaEarlyDischargeActionsMetadata["action"] = this
      .latestAction
      ? {
          type: this.latestAction.type,
          supervisorResponseType: this.latestAction.supervisorResponse?.type,
        }
      : undefined;

    const originalStatus = this.clientStatus;

    await this.rootStore.firestoreStore.deleteOpportunityActionHistory(this);

    this.rootStore.analyticsStore.trackUsIaEarlyDischargeOpportunityActions({
      staffId: userPseudoId ?? this.currentUserEmail,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      action: actionMetadata,
      currentStatus: originalStatus,
      subsequentStatus: this.clientStatus,
      revert: true,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    const customReqs = [] as OpportunityRequirement[];
    const {
      victimFlag,
      violationsPast6MonthsFlag,
      dnaRequirementStatus,
      dnaSubmittedFlag,
    } = this.record.metadata;

    if (!victimFlag) {
      customReqs.push({ text: "Has no DOC-registered victim" });
    }
    if (!violationsPast6MonthsFlag) {
      customReqs.push({
        text: "Has no violation incidents dated within the past 6 months",
      });
    }
    if (dnaRequirementStatus === "Not Required") {
      customReqs.push({
        text: "DNA is not required to be collected or uploaded to CODIS",
      });
    } else if (dnaSubmittedFlag) {
      customReqs.push({
        text: "DNA has been collected and successfully uploaded to CODIS",
      });
    }
    return super.requirementsMet.concat(customReqs);
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const customReqs = [] as OpportunityRequirement[];
    const {
      victimFlag,
      violationsPast6MonthsFlag,
      dnaSubmittedFlag,
      dnaRequirementStatus,
      openInterventionsFlag,
    } = this.record.metadata;

    if (victimFlag) {
      customReqs.push({
        text: "There are one or more registered victims in this case. Please complete victim notification.",
      });
    }
    if (violationsPast6MonthsFlag) {
      customReqs.push({
        text: "Has violation incidents dated within the past 6 months. Please review incident history.",
      });
    }
    if (!dnaSubmittedFlag) {
      const dnaNotSubmittedTooltip =
        "This tool determines successful DNA submission based on whether a CODIS date has been entered in ICON. If you've otherwise confirmed that DNA submission was successful, please proceed with the Early Discharge approval.";
      if (dnaRequirementStatus === "Definitely Required") {
        customReqs.push({
          text: "DNA is required to be collected but has not yet been successfully uploaded to CODIS",
          tooltip: dnaNotSubmittedTooltip,
        });
      } else if (dnaRequirementStatus === "Maybe Required") {
        customReqs.push({
          text: "DNA might be required to be collected but has not yet been successfully uploaded to CODIS. Please review DNA requirements based on charges.",
          tooltip: dnaNotSubmittedTooltip,
        });
      }
    }
    if (openInterventionsFlag) {
      customReqs.push({
        text: "Has open interventions in ICON. Please ensure client has completed court-ordered interventions.",
      });
    }
    return super.requirementsAlmostMet.concat(customReqs);
  }

  async handleAdditionalUndoActions(): Promise<void> {
    await this.deleteActionHistory();
  }

  get showRevertLinkFallback(): boolean {
    return this.clientStatus !== "ELIGIBLE_NOW";
  }

  get indefiniteSnoozeEnabled(): boolean {
    return !!this.rootStore.userStore.activeFeatureVariants.indefiniteSnooze;
  }

  maxManualSnoozeDays(denialReasons: string[]): number | undefined {
    const extendedSnoozeReasons = [
      "FINES & FEES",
      "DENIED",
      "INTERSTATE (IC-OUT)",
    ];
    const extendedSnoozeMaxLength = 365;
    if (intersection(extendedSnoozeReasons, denialReasons).length > 0) {
      return extendedSnoozeMaxLength;
    }
    if (this.indefiniteSnoozeEnabled) {
      const selectedIndefiniteReasons = intersection(
        Object.keys(this.indefiniteDenialReasons),
        denialReasons,
      );
      // If an indefinite denial reason is selected, we'll return undefined (i.e. there
      // is no max snooze length for this reason).
      if (selectedIndefiniteReasons.length > 0) {
        return undefined;
      }
    }
    return super.maxManualSnoozeDays(denialReasons);
  }

  get sldRelevantDenial(): boolean {
    const { reasons } = this.updates?.denial ?? {};
    // Reasons should never be empty, but we check just in case.
    if (!reasons || reasons.length === 0) return false;
    return reasons.every((item) => RELEVANT_ED_DENIAL_REASONS.includes(item));
  }

  /**
   * This opportunity shows a Banner Opportunity Preview if it has a "Pending" SLD companion opp
   */
  get sldCompanionOpportunity():
    | UsIaSupervisionLevelDowngradeOpportunity
    | undefined {
    const companionOpportunityType = "usIaCompleteSupervisionLevelDowngrade";
    const companionOpportunities = this.person.flattenedOpportunities.filter(
      (opp) => opp.type === companionOpportunityType,
    ) as UsIaSupervisionLevelDowngradeOpportunity[];

    if (companionOpportunities.length > 1) {
      throw new Error(
        "Expected either zero or one companion UsIASupervisionLevelDowngrade, received multiple.",
      );
    }

    return companionOpportunities.length === 0
      ? undefined
      : companionOpportunities[0];
  }

  get hasPendingSldCompanionOpportunity(): boolean {
    return (
      !!this.sldCompanionOpportunity?.almostEligible && this.sldRelevantDenial
    );
  }

  get actedOnTextAddition(): ActedOnTextAddition {
    return this.hasPendingSldCompanionOpportunity
      ? {
          DENIED:
            ". This client is now eligible for a Supervision Level Downgrade.",
        }
      : {};
  }

  trackSldNavigateToCompanionOpportunityLinkClicked(): void {
    this.rootStore.analyticsStore.trackNavigateToCompanionOpportunityLinkClicked(
      {
        justiceInvolvedPersonId: this.person.pseudonymizedId,
        opportunityType: this.type,
        companionOpportunityType: "usIaCompleteSupervisionLevelDowngrade",
      },
    );
  }

  get bannerInfo(): OpportunityBannerInfo | undefined {
    if (this.hasPendingSldCompanionOpportunity) {
      return {
        previewBannerHeading: `${this.person.displayName} may be eligible for a Supervision Level Downgrade`,
        previewBannerText:
          "This client will be pending for approximately 24 hours before they become eligible for a Supervision Level Downgrade.",
        link: workflowsUrl("opportunityClients", {
          urlSection: "supervisionLevelDowngrade",
        }),
        linkText: "See Pending Eligibility",
        onLinkClick: () =>
          this.trackSldNavigateToCompanionOpportunityLinkClicked(),
      };
    }
    return undefined;
  }

  get indefiniteDenialReasons() {
    if (this.indefiniteSnoozeEnabled) {
      const indefiniteReasonKeys = ["INTERSTATE (IC-IN)", "COURT"];
      return pick(this.denialReasons, indefiniteReasonKeys);
    } else {
      return super.indefiniteDenialReasons;
    }
  }

  get denialViewPrompt() {
    if (this.indefiniteSnoozeEnabled) {
      return "Temporary Snooze";
    }
    return super.denialViewPrompt;
  }
}
