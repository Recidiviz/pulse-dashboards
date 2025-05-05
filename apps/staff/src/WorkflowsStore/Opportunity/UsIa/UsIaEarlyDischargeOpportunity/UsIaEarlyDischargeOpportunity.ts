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

import {
  OfficerAction,
  OfficerApprovalAction,
  OfficerDenialAction,
  SupervisorAction,
} from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";
import { UsIaClientStatus } from "./types";
import {
  UsIaEarlyDischargeReferralRecord,
  usIaEarlyDischargeSchema,
} from "./UsIaEarlyDischargeOpportunitySchema";

export class UsIaEarlyDischargeOpportunity extends OpportunityBase<
  Client,
  UsIaEarlyDischargeReferralRecord
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usIaEarlyDischarge",
      client.rootStore,
      usIaEarlyDischargeSchema.parse(record),
    );
  }

  get actionHistory(): OfficerAction[] | undefined {
    return this.updates?.actionHistory;
  }
  
  get latestAction() {
    return this.actionHistory?.at(-1);
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
      by: this.currentUserEmail,
      ...officerActionParams,
    };
    const updatedActionHistory = (this.actionHistory ?? []).concat(
      officerAction,
    );

    // TODO(#8246): Start calling segment event fn here once we have the
    // opportunity tab/status functions

    await this.rootStore.firestoreStore.updateOpportunityActionHistory(
      this,
      updatedActionHistory,
    );
  }

  async setSupervisorResponse(
    supervisorResponseParams: Omit<SupervisorAction, "date" | "by">,
  ): Promise<void> {
    const supervisorResponse = {
      date: Timestamp.fromDate(new Date()),
      by: this.currentUserEmail,
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

    // TODO(#8246): Start calling segment event fn here once we have the
    // opportunity tab/status functions

    await this.rootStore.firestoreStore.updateOpportunityActionHistory(
      this,
      updatedActionHistory,
    );
  }

  async deleteActionHistory(): Promise<void> {
    // TODO(#8246): Call relevant segment event for status change

    await this.rootStore.firestoreStore.deleteOpportunityActionHistory(this);
  }
}
