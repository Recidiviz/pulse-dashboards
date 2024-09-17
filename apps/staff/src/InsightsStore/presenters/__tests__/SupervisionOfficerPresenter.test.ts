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
  ExcludedSupervisionOfficer,
  excludedSupervisionOfficerFixture,
  InsightsConfigFixture,
  SupervisionOfficer,
  supervisionOfficerFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { hydrationFailure, unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import {
  eligibleClient,
  lsuEligibleClient,
} from "../../../WorkflowsStore/__fixtures__";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenter } from "../SupervisionOfficerPresenter";
import * as utils from "../utils";
import { getOutlierOfficerData } from "../utils";

type TestOfficerType = SupervisionOfficer | ExcludedSupervisionOfficer;

let store: InsightsSupervisionStore;
let rootStore: RootStore;
let jiiStore: JusticeInvolvedPersonsStore;
const stateCode = "US_ID";
const pseudoId = "hashed-mavis123";
const testOfficerWithOutlierData = supervisionOfficerFixture[0];
const testSupervisor = supervisionOfficerSupervisorsFixture[0];
const testExcludedOfficer = excludedSupervisionOfficerFixture[0];

let presenter: SupervisionOfficerPresenter<TestOfficerType>;

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
  testOfficer: typeof testExcludedOfficer | typeof testOfficerWithOutlierData,
) => {
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);
  vi.spyOn(
    rootStore.firestoreStore,
    "getClientsForOfficerId",
  ).mockResolvedValue([lsuEligibleClient, eligibleClient]);

  const testClient1 = lsuEligibleClient;
  testClient1.allEligibleOpportunities.push("pastFTRD");
  const testClient2 = eligibleClient;
  testClient2.allEligibleOpportunities.push("LSU");

  store.setOfficerPseudoId(testOfficer.pseudonymizedId);
  vi.spyOn(
    rootStore.firestoreStore,
    "getClientsForOfficerId",
  ).mockResolvedValue([testClient1, testClient2]);

  const { workflowsRootStore } = rootStore;
  workflowsRootStore.populateJusticeInvolvedPersonsStore();
  if (workflowsRootStore.justiceInvolvedPersonsStore) {
    jiiStore = workflowsRootStore.justiceInvolvedPersonsStore;
    presenter = new SupervisionOfficerPresenter(
      store,
      testOfficer.pseudonymizedId,
      jiiStore,
      workflowsRootStore.opportunityConfigurationStore,
    );
  }

  vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
};

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

const officerCases = [
  ["with outlier data", testOfficerWithOutlierData],
  ["WITHOUT outlier data", testExcludedOfficer],
] as const;

describe.each(officerCases)("test officer %s", (label, testOfficer) => {
  beforeEach(() => {
    initPresenter(testOfficer);
  });

  describe("with unit data already hydrated", () => {
    beforeEach(async () => {
      await Promise.all([
        flowResult(
          store.populateOfficersForSupervisor(testSupervisor.pseudonymizedId),
        ),
        flowResult(
          store.populateExcludedOfficersForSupervisor(
            testSupervisor.pseudonymizedId,
          ),
        ),
        flowResult(store.populateSupervisionOfficerSupervisors()),
        flowResult(store.populateMetricConfigs()),
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
      vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
      vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
      vi.spyOn(
        InsightsOfflineAPIClient.prototype,
        "supervisionOfficerSupervisors",
      );
      vi.spyOn(
        InsightsOfflineAPIClient.prototype,
        "supervisionOfficerMetricEvents",
      );

      // add this expect in so that we can call the same one later in this test to ensure it didn't
      // get another call at that time
      expect(
        store.insightsStore.rootStore.firestoreStore.getClientsForOfficerId,
      ).toHaveBeenCalledTimes(1);
      await presenter.hydrate();

      expect(
        store.insightsStore.apiClient.metricBenchmarks,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficerSupervisors,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficer,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficerMetricEvents,
      ).not.toHaveBeenCalled();
      // This 1 time is from the beforeEach, since we set up this spy earlier
      expect(
        store.insightsStore.rootStore.firestoreStore.getClientsForOfficerId,
      ).toHaveBeenCalledTimes(1);
    });

    test("has outlierOfficerData", async () => {
      expect(presenter.outlierOfficerData).toBeDefined();
      expect(presenter.outlierOfficerData).toStrictEqual(
        getOutlierOfficerData<TestOfficerType>(testOfficer, store),
      );
    });

    test("has supervisorsInfo", () => {
      expect(presenter.supervisorsInfo).toBeDefined();
      expect(
        presenter.supervisorsInfo
          ?.map((s) => s.externalId)
          .every((id) => testOfficer.supervisorExternalIds.includes(id)),
      ).toBeTrue();
    });
  });

  test("hydration", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
    vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
    vi.spyOn(
      InsightsOfflineAPIClient.prototype,
      "supervisionOfficerSupervisors",
    );

    expect(presenter.hydrationState.status).toBe("needs hydration");

    await presenter.hydrate();

    expect(presenter.hydrationState.status).toBe("hydrated");
    expect(store.insightsStore.apiClient.metricBenchmarks).toHaveBeenCalled();
    expect(
      store.insightsStore.apiClient.supervisionOfficer,
    ).toHaveBeenCalledWith(testOfficer.pseudonymizedId);
    expect(
      store.insightsStore.apiClient.supervisionOfficerSupervisors,
    ).toHaveBeenCalled();
  });

  test("has outlierOfficerData", async () => {
    await presenter.hydrate();

    expect(presenter.outlierOfficerData).toBeDefined();
    expect(presenter.outlierOfficerData).toStrictEqual(
      getOutlierOfficerData(testOfficer, store),
    );
  });

  test("has supervisorsInfo", async () => {
    await presenter.hydrate();

    expect(presenter.supervisorsInfo).toBeDefined();
    expect(
      presenter.supervisorsInfo
        ?.map((s) => s.externalId)
        .every((id) => testOfficer.supervisorExternalIds.includes(id)),
    ).toBeTrue();
  });

  test("has timePeriod", async () => {
    await presenter.hydrate();

    const { timePeriod } = presenter;

    expect(timePeriod).toBeDefined();
    expect(timePeriod).toMatch("9/1/22 - 9/1/23");
  });

  test("has clients", async () => {
    await presenter.hydrate();
    expect(presenter.clients).toBeDefined();
    expect(presenter.clients).toHaveLength(2);
  });

  describe("has opportunity dependent fields", () => {
    beforeEach(async () => {
      await presenter.hydrate();

      // Mock opportunity hydration so that client functions populate.
      for (const client of presenter.clients ?? []) {
        for (const opp of Object.values(client.potentialOpportunities)) {
          vi.spyOn(opp, "hydrationState", "get").mockReturnValue({
            status: "hydrated",
          });
        }
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
        for (const opp of Object.values(client.potentialOpportunities)) {
          vi.spyOn(opp, "hydrationState", "get").mockReturnValue({
            status: "hydrated",
          });
        }
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

  test("hydration error in dependency", async () => {
    const err = new Error("fake error");
    vi.spyOn(
      InsightsSupervisionStore.prototype,
      "populateMetricConfigs",
    ).mockImplementation(() => {
      throw err;
    });

    await presenter.hydrate();
    expect(presenter.hydrationState).toEqual({
      status: "failed",
      error: err,
    });
  });

  test("error assembling metrics data", async () => {
    const expectedAggregateError = new Error("oops");
    const expectedAggregateErrorMessage = "Expected data failed to populate";
    vi.spyOn(utils, "getOutlierOfficerData").mockImplementation(() => {
      throw expectedAggregateError;
    });

    await presenter.hydrate();
    expect(hydrationFailure(presenter)?.message).toStrictEqual(
      expectedAggregateErrorMessage,
    );
    expect(unpackAggregatedErrors(presenter)).toStrictEqual([
      expectedAggregateError,
    ]);
    expect(presenter.outlierOfficerData).toBeUndefined();
  });
});
