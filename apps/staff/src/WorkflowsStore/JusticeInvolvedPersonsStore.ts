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

import { ClientRecord } from "~datatypes";
import { FlowMethod } from "~hydration-utils";

import FirestoreStore, {
  ClientOpportunityUpdateRecord,
} from "../FirestoreStore";
import { Client } from "./Client";
import { JusticeInvolvedPerson } from "./types";

export class JusticeInvolvedPersonsStore {
  caseloadByOfficerExternalId: Map<string, JusticeInvolvedPerson[]> = new Map();

  caseloadByReviewerId: Map<string, JusticeInvolvedPerson[]> = new Map();
  historicalCaseloadByReviewerId: Map<string, JusticeInvolvedPerson[]> =
    new Map();

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

    // If another call to this method has finished in the meantime, we don't
    // want to overwrite the caseload that's already there.
    if (this.caseloadByOfficerExternalId.has(officerExternalId)) return;
    this.caseloadByOfficerExternalId.set(
      officerExternalId,
      clientData.map((c) => new Client(c, this.firestoreStore.rootStore)),
    );
  }

  *populateCaseloadForReviewer(
    reviewerId: string,
  ): FlowMethod<FirestoreStore["getOpportunityUpdatesForReviewerId"], void> {
    const existingClientsByRecordId = new Map(
      (this.caseloadByReviewerId.get(reviewerId) ?? []).map((c) => [
        c.recordId,
        c,
      ]),
    );

    const opportunityUpdates =
      (yield this.firestoreStore.getOpportunityUpdatesForReviewerId(
        this.tenantId,
        reviewerId,
      )) as ClientOpportunityUpdateRecord[];

    const clientRecordIds = [
      ...new Set(
        opportunityUpdates
          .map((u) => u.clientRecordId)
          .filter((id) => id !== undefined),
      ),
    ];

    const newClientRecordIds = clientRecordIds.filter(
      (id) => !existingClientsByRecordId.has(id),
    );

    const newClientDataList = (yield this.firestoreStore.getClientsForRecordIds(
      newClientRecordIds,
    )) as ClientRecord[];

    const newClientsByRecordId = new Map(
      newClientDataList.map((c) => [
        c.recordId,
        new Client(c, this.firestoreStore.rootStore),
      ]),
    );

    this.caseloadByReviewerId.set(
      reviewerId,
      clientRecordIds
        .map(
          (id) =>
            existingClientsByRecordId.get(id) ?? newClientsByRecordId.get(id),
        )
        .filter((c) => c !== undefined),
    );
  }

  *populateHistoricalCaseloadForReviewer(
    reviewerId: string,
  ): FlowMethod<
    FirestoreStore["getOpportunityUpdatesByAllUniqueReviewerIds"],
    void
  > {
    const existingClientsByRecordId = new Map(
      (this.historicalCaseloadByReviewerId.get(reviewerId) ?? []).map((c) => [
        c.recordId,
        c,
      ]),
    );

    const historicalOpportunityUpdates =
      (yield this.firestoreStore.getOpportunityUpdatesByAllUniqueReviewerIds(
        this.tenantId,
        reviewerId,
      )) as ClientOpportunityUpdateRecord[];

    const historicalClientRecordIds = [
      ...new Set(
        historicalOpportunityUpdates
          .map((u) => u.clientRecordId)
          .filter((id) => id !== undefined),
      ),
    ];

    const newhistoricalClientRecordIds = historicalClientRecordIds.filter(
      (id) => !existingClientsByRecordId.has(id),
    );

    const newHistoricalClientDataList =
      (yield this.firestoreStore.getClientsForRecordIds(
        newhistoricalClientRecordIds,
      )) as ClientRecord[];

    const newHistoricalClientsByRecordId = new Map(
      newHistoricalClientDataList.map((c) => [
        c.recordId,
        new Client(c, this.firestoreStore.rootStore),
      ]),
    );

    this.historicalCaseloadByReviewerId.set(
      reviewerId,
      historicalClientRecordIds
        .map(
          (id) =>
            existingClientsByRecordId.get(id) ??
            newHistoricalClientsByRecordId.get(id),
        )
        .filter((c) => c !== undefined),
    );
  }
}
