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

import { configure, flowResult } from "mobx";

import {
  ClientRecord,
  InsightsConfigFixture,
  supervisionOfficerFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";

import { OpportunityMapping } from "../../../../../staff/src/WorkflowsStore";
import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { mockIneligibleClient } from "../../../WorkflowsStore/__fixtures__";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { mockFirestoreStoreClientsForOfficerId } from "../../../WorkflowsStore/subscriptions/__tests__/testUtils";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerOpportunitiesPresenter } from "../SupervisionOfficerOpportunitiesPresenter";

let store: InsightsSupervisionStore;
let rootStore: RootStore;
let jiiStore: JusticeInvolvedPersonsStore;
const stateCode = "US_ID";
const pseudoId = "hashed-mavis123";
const testOfficerWithOutcomes = supervisionOfficerFixture[0];
const testSupervisor = supervisionOfficerSupervisorsFixture[0];
// Officer where includeInOutcomes is false
const testExcludedOfficer = supervisionOfficerFixture[8];

let presenter: SupervisionOfficerOpportunitiesPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => pseudoId,
  );
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_ID",
  );

  rootStore = new RootStore();
  rootStore.tenantStore.currentTenantId = stateCode;
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  store = new InsightsSupervisionStore(
    rootStore.insightsStore,
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
});

const initPresenter = async (
  testOfficer: typeof testExcludedOfficer | typeof testOfficerWithOutcomes,
) => {
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);

  const lsuClient = {
    ...mockIneligibleClient,
    officerId: testOfficer.externalId,
    allEligibleOpportunities: ["LSU"],
  } as ClientRecord;

  const ftrdClient = {
    ...mockIneligibleClient,
    officerId: testOfficer.externalId,
    allEligibleOpportunities: ["pastFTRD"],
  } as ClientRecord;

  store.setOfficerPseudoId(testOfficer.pseudonymizedId);

  const { workflowsRootStore } = rootStore;
  workflowsRootStore.populateJusticeInvolvedPersonsStore();
  if (workflowsRootStore.justiceInvolvedPersonsStore) {
    jiiStore = workflowsRootStore.justiceInvolvedPersonsStore;
    presenter = new SupervisionOfficerOpportunitiesPresenter(
      store,
      testOfficer.pseudonymizedId,
      jiiStore,
      workflowsRootStore.opportunityConfigurationStore,
    );
  }

  await mockFirestoreStoreClientsForOfficerId(
    rootStore.firestoreStore,
    [lsuClient, ftrdClient],
    true, // return all clients
    undefined,
  );

  vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
};

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

const officerCases = [
  ["with outlier data", testOfficerWithOutcomes],
  ["WITHOUT outlier data", testExcludedOfficer],
] as const;

describe.each(officerCases)("test officer %s", (label, testOfficer) => {
  beforeEach(() => {
    initPresenter(testOfficer);
  });

  describe("with unit data already hydrated", () => {
    beforeEach(async () => {
      await Promise.all([
        flowResult(store.populateSupervisionOfficerSupervisors()),
        flowResult(
          store.populateOfficersForSupervisor(testSupervisor.pseudonymizedId),
        ),
        flowResult(
          jiiStore.populateCaseloadForSupervisionOfficer(
            testOfficer.externalId,
          ),
        ),
      ]);
    });

    test("is immediately hydrated", async () => {
      expect(presenter.hydrationState.status).toBe("hydrated");
    });

    test("makes no additional API calls", async () => {
      vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
      vi.spyOn(
        InsightsOfflineAPIClient.prototype,
        "supervisionOfficerSupervisors",
      );

      // add this expect in so that we can call the same one later in this test to ensure it didn't
      // get another call at that time
      expect(
        store.insightsStore.rootStore.firestoreStore.getClientsForOfficerId,
      ).toHaveBeenCalledTimes(1);
      await presenter.hydrate();

      expect(
        store.insightsStore.apiClient.supervisionOfficerSupervisors,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficer,
      ).not.toHaveBeenCalled();
      // This 1 time is from the beforeEach, since we set up this spy earlier
      expect(
        store.insightsStore.rootStore.firestoreStore.getClientsForOfficerId,
      ).toHaveBeenCalledTimes(1);
    });
  });

  test("hydration", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
    vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
    vi.spyOn(
      InsightsOfflineAPIClient.prototype,
      "supervisionOfficerSupervisors",
    );
    vi.spyOn(InsightsOfflineAPIClient.prototype, "outcomesForOfficer");

    expect(presenter.hydrationState.status).toBe("needs hydration");

    await presenter.hydrate();

    const officerPseudoId = testOfficer.pseudonymizedId;

    expect(presenter.hydrationState.status).toBe("hydrated");
    expect(
      store.insightsStore.apiClient.supervisionOfficer,
    ).toHaveBeenCalledWith(officerPseudoId);
  });

  test("has clients", async () => {
    await presenter.hydrate();
    expect(presenter.clients).toBeDefined();
    expect(presenter.clients).toHaveLength(2);
  });

  // TODO(#6534): Properly mock opportunities instead of skipping
  describe.skip("has opportunity dependent fields", () => {
    beforeEach(async () => {
      await presenter.hydrate();

      for (const client of presenter.clients ?? []) {
        vi.spyOn(client, "opportunities", "get")
          .mockResolvedValueOnce({
            compliantReporting: {
              type: "compliantReporting",
            },
          } as any as OpportunityMapping)
          .mockResolvedValueOnce({
            pastFTRD: {
              type: "pastFTRD",
            },
            LSU: {
              type: "LSU",
            },
          } as any as OpportunityMapping);
      }
    });

    test("has opportunitiesByType", async () => {
      const { opportunitiesByType } = presenter;

      expect(opportunitiesByType).toBeDefined();
      expect(opportunitiesByType?.pastFTRD.length).toEqual(1);
      expect(opportunitiesByType?.compliantReporting.length).toEqual(1);
      expect(opportunitiesByType?.LSU.length).toEqual(2);
    });

    test("has numEligibleOpportunities", async () => {
      const { numEligibleOpportunities } = presenter;

      expect(numEligibleOpportunities).toBeDefined();
      expect(numEligibleOpportunities).toEqual(4);
    });
  });

  test("has numClientsOnCaseload", async () => {
    await presenter.hydrate();

    const { numClientsOnCaseload } = presenter;

    expect(numClientsOnCaseload).toBeDefined();
    expect(numClientsOnCaseload).toEqual(2);
  });

  describe("does not have client-dependent fields if workflows is disabled", () => {
    beforeEach(async () => {
      vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(false);
      await presenter.hydrate();
      expect(presenter.hydrationState).toEqual({ status: "hydrated" });
      // Mock opportunity hydration so that client functions populate.
      for (const client of presenter.clients ?? []) {
        vi.spyOn(
          client.opportunityManager,
          "hydrationState",
          "get",
        ).mockReturnValue({
          status: "hydrated",
        });
      }
    });

    test("does not have clients", async () => {
      expect(presenter.clients).toBeUndefined();
    });

    test("does not have numClientsOnCaseload", async () => {
      expect(presenter.numClientsOnCaseload).toBeUndefined();
    });

    test("does not have opportunitiesByType", async () => {
      expect(presenter.opportunitiesByType).toBeUndefined();
    });

    test("does not have numEligibleOpportunities", async () => {
      expect(presenter.numEligibleOpportunities).toBeUndefined();
    });
  });
});
