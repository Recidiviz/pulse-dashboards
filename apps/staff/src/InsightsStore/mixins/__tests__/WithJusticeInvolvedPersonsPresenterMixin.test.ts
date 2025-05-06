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
import { vi } from "vitest";

import { InsightsConfigFixture, supervisionOfficerFixture } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { TenantId } from "../../../RootStore/types";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { MOCK_OPPORTUNITY_CONFIGS } from "../../../WorkflowsStore/Opportunity/__fixtures__";
import { opportunityConstructors } from "../../../WorkflowsStore/Opportunity/opportunityConstructors";
import { mockFirestoreStoreClientsForOfficerId } from "../../../WorkflowsStore/subscriptions/__tests__/testUtils";
import { CLIENTS_OFFICERS } from "../../models/offlineFixtures/ClientFixture";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { MockOpportunity } from "../__mocks__/MockOpportunity";
import { MockSupervisionPresenterWithJiiMixin } from "../__mocks__/MockSupervisionPresenterWithJiiMixin";

const officersExternalIds = CLIENTS_OFFICERS.map((o) => o.externalId);
const OFFICER_WITH_NO_CLIENTS = supervisionOfficerFixture[9];
officersExternalIds.push(OFFICER_WITH_NO_CLIENTS.externalId);

let presenter: MockSupervisionPresenterWithJiiMixin;
let store: InsightsSupervisionStore;
let jiiStore: JusticeInvolvedPersonsStore | undefined;

beforeEach(async () => {
  configure({ safeDescriptors: false });
  vi.useFakeTimers();
  vi.runAllTimersAsync();

  // ROOTSTORE =========================================================
  const mockRootStore = new RootStore();

  // SUPERVISION STORE =================================================
  store = new InsightsSupervisionStore(
    mockRootStore.insightsStore,
    InsightsConfigFixture,
  );
  mockRootStore.tenantStore.setCurrentTenantId("US_XX" as TenantId);

  // JII STORE =========================================================
  mockRootStore.workflowsRootStore.populateJusticeInvolvedPersonsStore();
  const { justiceInvolvedPersonsStore } = mockRootStore.workflowsRootStore;

  if (justiceInvolvedPersonsStore) {
    jiiStore = justiceInvolvedPersonsStore;

    presenter = new MockSupervisionPresenterWithJiiMixin(
      store,
      CLIENTS_OFFICERS[0].pseudonymizedId,
      justiceInvolvedPersonsStore,
    );

    // TODO: (#6012) Create the rest of tests for the various types of opportunityMappings.
    presenter.opportunityMapping = "opportunitiesEligible";
  }

  await mockFirestoreStoreClientsForOfficerId(mockRootStore.firestoreStore);

  // OPPORTUNITIES ========================================================
  mockRootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated(
    MOCK_OPPORTUNITY_CONFIGS,
  );

  vi.spyOn(
    mockRootStore.firestoreStore,
    "getOpportunitiesForJIIAndOpportunityType",
  ).mockResolvedValue([]);

  // @ts-ignore
  opportunityConstructors["mockUsXxOpp"] = MockOpportunity;
  // @ts-ignore
  opportunityConstructors["mockUsXxOppTwo"] = MockOpportunity;
  // PRESENTER ==============================================================
  vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
});

afterAll(() => {
  configure({ safeDescriptors: true });
  vi.useRealTimers();
});

describe("JusticeInvolvedPersonsStore", () => {
  it("should initialize properly with valid arguments", () => {
    expect(presenter).toBeInstanceOf(MockSupervisionPresenterWithJiiMixin);
  });

  it("should have jiiStore initialized", () => {
    expect(jiiStore).toBeDefined();
  });

  describe("prior to population of caseload", () => {
    describe("Method: expectCaseloadPopulated", () => {
      it("should throw when an externalId is undefined", () => {
        expect(() =>
          presenter.expectCaseloadPopulated(undefined),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Officer \`externalId\` is undefined.]`,
        );
      });

      it("should throw when an externalId leads to an undefined on the caseload", () => {
        expect(() =>
          presenter.expectCaseloadPopulated(officersExternalIds[0]),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Failed to populate clients for externalId OFFICER4]`,
        );
      });

      it("should not throw when isWorkflowsEnabled is false", () => {
        vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(false);
        expect(() =>
          presenter.expectCaseloadPopulated(officersExternalIds[0]),
        ).not.toThrow();
      });
    });
  });

  describe("after population of an officer caseload", () => {
    beforeEach(async () => {
      await presenter.populateCaseloadForOfficer(officersExternalIds[0]);
    });

    it("should have test officer present in caseload map", () => {
      const testCaseload = jiiStore?.caseloadByOfficerExternalId.get(
        officersExternalIds[0],
      );
      expect(testCaseload?.length).toEqual(8);
    });

    it("should have populated clients for the officer", () => {
      expect(() =>
        presenter.expectCaseloadPopulated(officersExternalIds[0]),
      ).not.toThrow();
    });

    it(`finds clients for the populated officer, ${officersExternalIds[0]}`, () => {
      const clients = presenter.findClientsForOfficer(officersExternalIds[0]);
      expect(clients?.length).toEqual(8);
    });
  });

  describe("after population of all caseloads + opportunities", () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      vi.runAllTimersAsync();
      presenter.personFieldsToHydrate = ["opportunityManager"];
      await Promise.all(
        officersExternalIds.map((id) =>
          presenter.populateCaseloadForOfficer(id),
        ),
      );
    });

    it("should have all officers present as keys", () => {
      const populatedOfficers = Array.from(
        jiiStore?.caseloadByOfficerExternalId.keys() || [],
      );

      expect(populatedOfficers.length).toBe(officersExternalIds.length);
      expect(
        populatedOfficers.every((key) => officersExternalIds.includes(key)),
      ).toBeTrue();
    });

    describe("Method: expectCaseloadPopulated", () => {
      it("should not throw", () => {
        expect(() =>
          presenter.expectCaseloadPopulated(officersExternalIds[0]),
        ).not.toThrow();
      });

      it("should throw for an undefined externalId", () => {
        expect(() =>
          presenter.expectCaseloadPopulated(undefined),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Officer \`externalId\` is undefined.]`,
        );
      });

      it("should throw for an assumed valid externalId on the caseload that returns undefined", () => {
        // We assume that this externalId was retrieved from some valid source.
        const ASSUMED_VALID_EXTERNAL_ID = "CASELOAD_DNE";

        // NOTE: We expect this to fail because, when the externalId is valid, we expect the caseload to be an empty list.
        expect(() =>
          presenter.expectCaseloadPopulated(ASSUMED_VALID_EXTERNAL_ID),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Failed to populate clients for externalId CASELOAD_DNE]`,
        );
      });

      it("should not throw when isWorkflowsEnabled is false", () => {
        vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(false);
        expect(() =>
          presenter.expectCaseloadPopulated(officersExternalIds[0]),
        ).not.toThrow();
      });
    });

    // TODO(#6534): Properly mock opportunities instead of skipping
    describe.skip("Method: countOpportunitiesForOfficer", () => {
      const OFFICER_COUNT_CASES: [string, number][] = [
        [officersExternalIds[0], 6],
        [officersExternalIds[1], 5],
        [officersExternalIds[2], 4],
        [officersExternalIds[3], 5],
      ];

      it.each(OFFICER_COUNT_CASES)(
        "Proper count of clients for officer %d",
        (officerId, expectedCount) => {
          expect(presenter.countOpportunitiesForOfficer(officerId)).toBe(
            expectedCount,
          );
        },
      );

      it(`returns undefined for an externalId that does not exist (DNE) on caseload`, () => {
        expect(presenter.countOpportunitiesForOfficer("DNE")).toEqual(
          undefined,
        );
      });

      it(`returns 0 for supervision officer with no clients,
      ${OFFICER_WITH_NO_CLIENTS.externalId}`, () => {
        expect(
          presenter.countOpportunitiesForOfficer(
            OFFICER_WITH_NO_CLIENTS.externalId,
          ),
        ).toEqual(0);
      });
    });

    // TODO(#6534): Properly mock opportunities instead of skipping
    describe.skip("Method: opportunitiesByTypeForOfficer", () => {
      it("returns the officers for an officer with a valid externalId", () => {
        const oppsByType = presenter.opportunitiesByTypeForOfficer(
          officersExternalIds[0],
        );
        expect(oppsByType).toBeDefined();
        const opps = Object.values(oppsByType || {}).flat();
        expect(opps.length).toEqual(6);
        expect(
          opps.every(
            (opp) => opp.person.assignedStaffId === officersExternalIds[0],
          ),
        ).toBeTrue();
      });

      it("returns undefined for an externalId that does not exist (DNE)", () => {
        expect(presenter.opportunitiesByTypeForOfficer("DNE")).toBeUndefined();
      });

      it(`returns an empty object for supervision officer with no clients,
      ${OFFICER_WITH_NO_CLIENTS.externalId}`, () => {
        expect(
          presenter.opportunitiesByTypeForOfficer(
            OFFICER_WITH_NO_CLIENTS.externalId,
          ),
        ).toStrictEqual({});
      });
    });
  });
});
