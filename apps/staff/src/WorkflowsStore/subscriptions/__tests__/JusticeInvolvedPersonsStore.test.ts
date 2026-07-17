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

import { configure } from "mobx";
import { Mocked } from "vitest";

import { ClientRecord } from "~datatypes";

import FirestoreStore, {
  ClientOpportunityUpdateRecord,
} from "../../../FirestoreStore";
import { getMockOpportunityConstructor } from "../../../InsightsStore/mixins/__mocks__/MockOpportunity";
import {
  clientFixture,
  CLIENTS_OFFICERS,
} from "../../../InsightsStore/models/offlineFixtures/ClientFixture";
import { RootStore } from "../../../RootStore";
import { TenantId } from "../../../RootStore/types";
import { Client } from "../../Client";
import { JusticeInvolvedPersonsStore } from "../../JusticeInvolvedPersonsStore";
import {
  mockUsXxOpp,
  mockUsXxOppConfig,
  mockUsXxTwoOpp,
  mockUsXxTwoOppConfig,
} from "../../Opportunity/__fixtures__";
import { opportunityConstructors } from "../../Opportunity/opportunityConstructors";
import { mockFirestoreStoreClientsForOfficerId } from "./testUtils";

let firestoreStoreMock: Mocked<FirestoreStore>;
let rootStoreMock: Mocked<RootStore>;
let store: Mocked<JusticeInvolvedPersonsStore>;

const [CLIENT_RECORD_A, CLIENT_RECORD_B] =
  Object.values<ClientRecord>(clientFixture);

beforeEach(() => {
  configure({ safeDescriptors: false });
  rootStoreMock = vi.mocked(new RootStore());
  firestoreStoreMock = vi.mocked(rootStoreMock.firestoreStore);
  rootStoreMock.workflowsRootStore.populateJusticeInvolvedPersonsStore();
  if (rootStoreMock.workflowsRootStore.justiceInvolvedPersonsStore)
    store = vi.mocked(
      rootStoreMock.workflowsRootStore.justiceInvolvedPersonsStore,
    );
  else throw new Error("JusticeInvolvedPersonsStore not found");

  rootStoreMock.workflowsStore.opportunityConfigurationStore.mockHydrated({
    [mockUsXxOpp]: mockUsXxOppConfig,
    [mockUsXxTwoOpp]: mockUsXxTwoOppConfig,
  });

  rootStoreMock.tenantStore.setCurrentTenantId("US_XX" as unknown as TenantId);

  mockFirestoreStoreClientsForOfficerId(firestoreStoreMock);

  // @ts-ignore - override readonly property
  opportunityConstructors[mockUsXxOpp] =
    getMockOpportunityConstructor(mockUsXxOpp);
  // @ts-ignore - override readonly property
  opportunityConstructors[mockUsXxTwoOpp] =
    getMockOpportunityConstructor(mockUsXxTwoOpp);

  vi.spyOn(
    firestoreStoreMock,
    "getOpportunityUpdatesForReviewerId",
  ).mockResolvedValue([]);
  vi.spyOn(firestoreStoreMock, "getClientsForRecordIds").mockResolvedValue([]);
});

afterAll(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

describe("JusticeInvolvedPersonsStore", () => {
  describe.each(CLIENTS_OFFICERS)(
    "when populating Clients for officer with externalId $externalId",
    (testOfficer) => {
      it("does nothing if caseload already exists for the officer", () => {
        store.caseloadByOfficerExternalId.set(testOfficer.externalId, []);
        store.populateCaseloadForSupervisionOfficer(testOfficer.externalId);
        expect(
          firestoreStoreMock.getClientsForOfficerId,
        ).not.toHaveBeenCalled();
      });

      it("fetches Clients and populates caseload when not already populated", async () => {
        await store.populateCaseloadForSupervisionOfficer(
          testOfficer.externalId,
        );
        const caseload = store.caseloadByOfficerExternalId.get(
          testOfficer.externalId,
        );

        expect(caseload).toBeDefined();
        expect(firestoreStoreMock.getClientsForOfficerId).toHaveBeenCalled();
        const expectedClientIds = Object.values<ClientRecord>(clientFixture)
          .filter((fixture) => fixture.officerId === testOfficer.externalId)
          .map((expectedClient) =>
            expectedClient.recordId.replace("us_xx_", ""),
          );
        const caseloadClientIds = caseload?.map((c) => c.externalId);

        expect(caseloadClientIds).toContainAllValues(expectedClientIds);
      });

      it("throws an error if tenant ID is missing when fetching clients", async () => {
        rootStoreMock.tenantStore.setCurrentTenantId(undefined);
        expect.assertions(1);
        try {
          await store.populateCaseloadForSupervisionOfficer(
            testOfficer.externalId,
          );
        } catch (e) {
          expect((e as Error).message).toEqual("Tenant ID must be set");
        }
      });
    },
  );

  describe("Method: populateCaseloadForReviewer", () => {
    it("fetches opportunity updates for the reviewer and populates the caseload with the resulting Clients", async () => {
      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [
          { clientRecordId: CLIENT_RECORD_A.recordId },
          { clientRecordId: CLIENT_RECORD_B.recordId },
        ] as ClientOpportunityUpdateRecord[],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_A,
        CLIENT_RECORD_B,
      ]);

      await store.populateCaseloadForReviewer("reviewer-1");

      expect(
        firestoreStoreMock.getOpportunityUpdatesForReviewerId,
      ).toHaveBeenCalledWith("US_XX", "reviewer-1");
      expect(firestoreStoreMock.getClientsForRecordIds).toHaveBeenCalledWith([
        CLIENT_RECORD_A.recordId,
        CLIENT_RECORD_B.recordId,
      ]);

      const caseload = store.caseloadByReviewerId.get("reviewer-1");
      expect(caseload?.[0]).toBeInstanceOf(Client);
      expect(caseload?.map((c) => c.externalId)).toEqual([
        CLIENT_RECORD_A.personExternalId,
        CLIENT_RECORD_B.personExternalId,
      ]);
    });

    it("dedupes clientRecordIds and filters out updates with no clientRecordId", async () => {
      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [
          { clientRecordId: CLIENT_RECORD_A.recordId },
          { clientRecordId: CLIENT_RECORD_A.recordId },
          {},
        ] as ClientOpportunityUpdateRecord[],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_A,
      ]);

      await store.populateCaseloadForReviewer("reviewer-1");

      expect(firestoreStoreMock.getClientsForRecordIds).toHaveBeenCalledWith([
        CLIENT_RECORD_A.recordId,
      ]);
    });

    it("reuses an existing Client instance for the reviewer when its record ID is still present", async () => {
      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [{ clientRecordId: CLIENT_RECORD_A.recordId }],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_A,
      ]);
      await store.populateCaseloadForReviewer("reviewer-1");
      const existingClient = store.caseloadByReviewerId.get("reviewer-1")?.[0];

      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [{ clientRecordId: CLIENT_RECORD_A.recordId }],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_A,
      ]);
      await store.populateCaseloadForReviewer("reviewer-1");

      expect(store.caseloadByReviewerId.get("reviewer-1")?.[0]).toBe(
        existingClient,
      );
    });

    it("overwrites the caseload for that reviewer rather than appending to it", async () => {
      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [{ clientRecordId: CLIENT_RECORD_A.recordId }],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_A,
      ]);
      await store.populateCaseloadForReviewer("reviewer-1");

      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [{ clientRecordId: CLIENT_RECORD_B.recordId }],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_B,
      ]);
      await store.populateCaseloadForReviewer("reviewer-1");

      const caseload = store.caseloadByReviewerId.get("reviewer-1");
      expect(caseload).toHaveLength(1);
      expect(caseload?.[0].externalId).toEqual(
        CLIENT_RECORD_B.personExternalId,
      );
    });

    it("keeps caseloads for different reviewers separate", async () => {
      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [{ clientRecordId: CLIENT_RECORD_A.recordId }],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_A,
      ]);
      await store.populateCaseloadForReviewer("reviewer-1");

      firestoreStoreMock.getOpportunityUpdatesForReviewerId.mockResolvedValueOnce(
        [{ clientRecordId: CLIENT_RECORD_B.recordId }],
      );
      firestoreStoreMock.getClientsForRecordIds.mockResolvedValueOnce([
        CLIENT_RECORD_B,
      ]);
      await store.populateCaseloadForReviewer("reviewer-2");

      expect(
        store.caseloadByReviewerId.get("reviewer-1")?.[0].externalId,
      ).toEqual(CLIENT_RECORD_A.personExternalId);
      expect(
        store.caseloadByReviewerId.get("reviewer-2")?.[0].externalId,
      ).toEqual(CLIENT_RECORD_B.personExternalId);
    });

    it("throws an error if tenant ID is missing", async () => {
      rootStoreMock.tenantStore.setCurrentTenantId(undefined);
      expect.assertions(1);
      try {
        await store.populateCaseloadForReviewer("reviewer-1");
      } catch (e) {
        expect((e as Error).message).toEqual("Tenant ID must be set");
      }
    });
  });
});
