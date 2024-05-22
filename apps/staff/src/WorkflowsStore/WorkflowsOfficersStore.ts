// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { makeAutoObservable } from "mobx";

import { StaffRecord } from "~datatypes";
import { FirestoreAPI } from "~firestore-api";
import { FlowMethod } from "~hydration-utils";

import { WorkflowsRootStore } from "./WorkflowsRootStore";

export class WorkflowsOfficersStore {
  officersBySupervisorExternalId: Map<string, StaffRecord[]> = new Map();

  constructor(public readonly workflowsStore: WorkflowsRootStore) {
    makeAutoObservable(this);
  }

  *populateSupervisionOfficersForSupervisor(
    supervisorExternalId: string,
  ): FlowMethod<FirestoreAPI["staffRecordsWithSupervisor"], void> {
    if (this.officersBySupervisorExternalId.has(supervisorExternalId)) return;

    const officersData =
      yield this.workflowsStore.apiClient.staffRecordsWithSupervisor(
        supervisorExternalId,
      );

    this.officersBySupervisorExternalId.set(supervisorExternalId, officersData);
  }
}
