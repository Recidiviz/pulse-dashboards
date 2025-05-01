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

  // TODO(#8239): add a new officer action to the action history array
  // and call the updateOpportunityActionHistory firestore fn
  async setOfficerAction(
    officerActionParams: OfficerApprovalAction | OfficerDenialAction,
  ): Promise<void> {
    return;
  }

  // TODO(#8239): modify the most recent officer action to have a supervisor response
  // and call the updateOpportunityActionHistory
  async setSupervisorResponse(
    supervisorResponseParams: Omit<SupervisorAction, "date" | "by">,
  ): Promise<void> {
    return;
  }

  // TODO(#8239): call the relevant deletion firestore fn
  async deleteActionHistory(): Promise<void> {
    return;
  }
}
