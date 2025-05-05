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
