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

import { FlowMethod } from "~hydration-utils";

import FirestoreStore from "../FirestoreStore";
import { Client } from "./Client";
import { JusticeInvolvedPerson } from "./types";

export class JusticeInvolvedPersonsStore {
  caseloadByOfficerExternalId: Map<string, JusticeInvolvedPerson[]> = new Map();

  constructor(private readonly firestoreStore: FirestoreStore) {
    makeAutoObservable(this);
  }

  private get tenantId() {
    const tenantId = this.firestoreStore.rootStore.currentTenantId;
    if (!tenantId) throw new Error("Tenant ID must be set");
    return tenantId;
  }

  *populateCaseloadForSupervisionOfficer(
    officerExternalId: string,
  ): FlowMethod<FirestoreStore["getClientsForOfficerId"], void> {
    if (this.caseloadByOfficerExternalId.has(officerExternalId)) return;

    const clientData = yield this.firestoreStore.getClientsForOfficerId(
      this.tenantId,
      officerExternalId,
    );

    this.caseloadByOfficerExternalId.set(
      officerExternalId,
      clientData.map((c) => new Client(c, this.firestoreStore.rootStore)),
    );
  }
}
