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

import { OPPORTUNITY_STATUS_COLORS } from "../../../../core/utils/workflowsUtils";
import {
  OfficerAction,
  OfficerApprovalAction,
  OfficerDenialAction,
  SupervisorAction,
} from "../../../../FirestoreStore";
import { UsIaEarlyDischargeActionsMetadata } from "../../../../RootStore/AnalyticsStore/AnalyticsStore";
import { Client } from "../../../Client";
import { UsIaEarlyDischargeForm } from "../../Forms/UsIaEarlyDischargeForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  OpportunityRequirement,
  OpportunityTab,
  RevertConfirmationCopy,
} from "../../types";
import { UsIaClientStatus } from "./types";
import {
  UsIaEarlyDischargeReferralRecord,
  usIaEarlyDischargeSchema,
} from "./UsIaEarlyDischargeOpportunitySchema";

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

  get actionHistory(): OfficerAction[] | undefined {
    return this.updates?.actionHistory;
  }

  get latestAction() {
    return this.actionHistory?.at(-1);
  }

  get mostRecentActions() {
    return this.actionHistory?.slice(-2);
  }

  get clientStatus(): UsIaClientStatus {
    const officerAction = this.latestAction;
    const supervisorResponse = officerAction?.supervisorResponse;

    if (this.denied) {
      return "DENIED";
    }

    if (this.isSubmitted) {
      return "SUBMITTED";
    }

    if (officerAction) {
      if (!supervisorResponse) {
        // Officer submits their approval/denial of a client for supervisor review
        if (officerAction.type === "APPROVAL") {
          return "DISCHARGE_FORM_REVIEW";
        }
        if (officerAction.type === "DENIAL") {
          return "ACTION_PLAN_REVIEW";
        }
      } else {
        // Supervisor responds to officer's approval/denial by either approving, denying (with an action plan)
        // or requesting revisions to an action plan
        if (officerAction.type === "APPROVAL") {
          if (supervisorResponse.type === "APPROVAL") {
            return "READY_FOR_DISCHARGE";
          }
          if (supervisorResponse.type === "DENIAL") {
            return "ACTION_PLAN_REVIEW";
          }
        }
        // Supervisor requests revisions to an officer's denial and action plan
        if (
          officerAction.type === "DENIAL" &&
          supervisorResponse.type === "DENIAL"
        ) {
          return "ACTION_PLAN_REVIEW_REVISION";
        }
      }
    }

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

    const mostRecentOfficerAction = this.actionHistory?.at(-1);

    if (!this.actionHistory || !mostRecentOfficerAction) {
      throw new Error(
        `Supervisor cannot respond when there is no existing Action History`,
      );
    }

    const updatedOfficerAction = {
      ...mostRecentOfficerAction,
      supervisorResponse,
    };

    const updatedActionHistory = this.actionHistory
      .slice(0, -1)
      .concat(updatedOfficerAction);

    const { userPseudoId } = this.rootStore.userStore;
    const actionMetadata: UsIaEarlyDischargeActionsMetadata["action"] = {
      type: mostRecentOfficerAction.type,
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
    const customReqs = [];
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
    const customReqs = [];
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
      if (dnaRequirementStatus === "Definitely Required") {
        customReqs.push({
          text: "DNA is required to be collected but has not yet been successfully uploaded to CODIS",
        });
      } else if (dnaRequirementStatus === "Maybe Required") {
        customReqs.push({
          text: "DNA might be required to be collected but has not yet been successfully uploaded to CODIS. Please review DNA requirements based on charges.",
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
}
