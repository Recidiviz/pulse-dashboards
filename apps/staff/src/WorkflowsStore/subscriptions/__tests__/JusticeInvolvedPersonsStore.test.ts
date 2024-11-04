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

import { ClientRecord, OpportunityType } from "~datatypes";

import FirestoreStore from "../../../FirestoreStore";
import { getMockOpportunityConstructor } from "../../../InsightsStore/mixins/__mocks__/MockOpportunity";
import {
  clientFixture,
  CLIENTS_OFFICERS,
} from "../../../InsightsStore/models/offlineFixtures/ClientFixture";
import { RootStore } from "../../../RootStore";
import { TenantId } from "../../../RootStore/types";
import { JusticeInvolvedPersonsStore } from "../../JusticeInvolvedPersonsStore";
import { mockUsXxOpp, mockUsXxTwoOpp } from "../../Opportunity/__fixtures__";
import { OpportunityConfigurationStore } from "../../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { opportunityConstructors } from "../../Opportunity/opportunityConstructors";
import { mockFirestoreStoreClientsForOfficerId } from "./testUtils";

let firestoreStoreMock: Mocked<FirestoreStore>;
let rootStoreMock: Mocked<RootStore>;
let store: Mocked<JusticeInvolvedPersonsStore>;

function setTestEnabledOppTypes(oppTypes: OpportunityType[]) {
  vi.spyOn(
    OpportunityConfigurationStore.prototype,
    "enabledOpportunityTypes",
    "get",
  ).mockReturnValue(oppTypes);
}

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

  rootStoreMock.tenantStore.setCurrentTenantId("US_XX" as unknown as TenantId);

  mockFirestoreStoreClientsForOfficerId(firestoreStoreMock);

  setTestEnabledOppTypes([mockUsXxOpp, mockUsXxTwoOpp]);
  // @ts-ignore - override readonly property
  opportunityConstructors[mockUsXxOpp] =
    getMockOpportunityConstructor(mockUsXxOpp);
  // @ts-ignore - override readonly property
  opportunityConstructors[mockUsXxTwoOpp] =
    getMockOpportunityConstructor(mockUsXxTwoOpp);
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
});
