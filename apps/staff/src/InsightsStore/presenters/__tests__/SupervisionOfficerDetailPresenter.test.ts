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
  supervisionOfficerOutcomesFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import { mockIneligibleClient } from "../../../WorkflowsStore/__fixtures__";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { mockFirestoreStoreClientsForOfficerId } from "../../../WorkflowsStore/subscriptions/__tests__/testUtils";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerDetailPresenter } from "../SupervisionOfficerDetailPresenter";
import * as utils from "../utils";

let store: InsightsSupervisionStore;
let jipStore: JusticeInvolvedPersonsStore;
const pseudoId = "hashed-agonzalez123";
const stateCode = "US_CA";

beforeEach(async () => {
  configure({ safeDescriptors: false });
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => pseudoId,
  );
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => stateCode,
  );

  const rootStore = new RootStore();
  store = new InsightsSupervisionStore(
    rootStore.insightsStore,
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);
  store.setMetricId(testMetric.metricId);

  const { workflowsRootStore } = rootStore;
  rootStore.tenantStore.currentTenantId = stateCode;
  workflowsRootStore.populateJusticeInvolvedPersonsStore();
  if (workflowsRootStore.justiceInvolvedPersonsStore) {
    jipStore = workflowsRootStore.justiceInvolvedPersonsStore;
    presenter = new SupervisionOfficerDetailPresenter(
      store,
      testOfficer.pseudonymizedId,
      jipStore,
    );
  }

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

  await mockFirestoreStoreClientsForOfficerId(
    rootStore.firestoreStore,
    [lsuClient, ftrdClient],
    true, // return all clients
    testOfficer.externalId,
  );

  vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

const testOfficer = supervisionOfficerFixture[0];
const testOutcomes = supervisionOfficerOutcomesFixture[0];
const testMetric = testOutcomes.outlierMetrics[0];
const testSupervisor = supervisionOfficerSupervisorsFixture[0];
let presenter: SupervisionOfficerDetailPresenter;

describe("with unit data already hydrated", () => {
  beforeEach(async () => {
    await Promise.all([
      flowResult(
        store.populateOfficersForSupervisor(testSupervisor.pseudonymizedId),
      ),
      flowResult(store.populateSupervisionOfficerSupervisors()),
      flowResult(store.populateMetricConfigs()),
      flowResult(
        store.populateOutcomesForSupervisor(testSupervisor.pseudonymizedId),
      ),
      flowResult(
        jipStore.populateCaseloadForSupervisionOfficer(testOfficer.externalId),
      ),
    ]);
  });

  test("is immediately hydrated", () => {
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
  });

  test("has officerOutcomesData", async () => {
    expect(presenter.officerOutcomesData).toBeDefined();
    expect(presenter.officerOutcomesData).toMatchSnapshot();
  });

  test("has metricInfo", async () => {
    expect(presenter.metricId).toEqual(testMetric.metricId);
    expect(presenter.metricInfo).toBeDefined();
  });

  test("has supervisorsInfo", () => {
    expect(presenter.supervisorsInfo).toBeDefined();
    expect(presenter.supervisorsInfo).toEqual([
      supervisionOfficerSupervisorsFixture[0],
      supervisionOfficerSupervisorsFixture[1],
    ]);
  });

  test("has numClientsOnCaseload", async () => {
    expect(presenter.numClientsOnCaseload).toEqual(2);
  });

  test("has goToSupervisorInfo for mostRecentSupervisor", () => {
    store.setMostRecentlySelectedSupervisorPseudoId(
      supervisionOfficerSupervisorsFixture[1].pseudonymizedId,
    );
    expect(presenter.goToSupervisorInfo).toBeDefined();
    expect(presenter.goToSupervisorInfo).toEqual(
      supervisionOfficerSupervisorsFixture[1],
    );
  });

  test("has goToSupervisorInfo without mostRecentSupervisor", () => {
    store.setMostRecentlySelectedSupervisorPseudoId(undefined);
    expect(presenter.goToSupervisorInfo).toBeDefined();
    expect(presenter.goToSupervisorInfo).toEqual(
      supervisionOfficerSupervisorsFixture[0],
    );
  });
});

test("hydration", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
  vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
  vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficerSupervisors");
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "supervisionOfficerMetricEvents",
  );

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.insightsStore.apiClient.metricBenchmarks).toHaveBeenCalled();
  expect(store.insightsStore.apiClient.supervisionOfficer).toHaveBeenCalledWith(
    testOfficer.pseudonymizedId,
  );
  expect(
    store.insightsStore.apiClient.supervisionOfficerMetricEvents,
  ).toHaveBeenCalledWith(testOfficer.pseudonymizedId, testMetric.metricId);
  expect(
    store.insightsStore.apiClient.supervisionOfficerSupervisors,
  ).toHaveBeenCalled();
});

test("has officerOutcomesData", async () => {
  await presenter.hydrate();

  expect(presenter.officerOutcomesData).toBeDefined();
  expect(presenter.officerOutcomesData).toMatchSnapshot();
});

test("has metricInfo", async () => {
  await presenter.hydrate();

  expect(presenter.metricInfo?.name).toEqual(testMetric.metricId);
});

test("has supervisorsInfo", async () => {
  await presenter.hydrate();

  expect(presenter.supervisorsInfo).toBeDefined();
  expect(presenter.supervisorsInfo).toEqual([
    supervisionOfficerSupervisorsFixture[0],
    supervisionOfficerSupervisorsFixture[1],
  ]);
});

test("has timePeriod", async () => {
  await presenter.hydrate();

  const { timePeriod } = presenter;

  expect(timePeriod).toBeDefined();
  expect(timePeriod).toMatch("12/1/20 - 12/1/21");
});

test("has numClientsOnCaseload", async () => {
  await presenter.hydrate();

  expect(presenter.numClientsOnCaseload).toEqual(2);
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
  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("error assembling metrics data", async () => {
  vi.spyOn(utils, "getOfficerOutcomesData").mockImplementation(() => {
    throw new Error("oops");
  });

  await presenter.hydrate();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);
  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: oops],
    ]
  `);
  expect(presenter.officerOutcomesData).toBeUndefined();
});

test("track staff page viewed events", async () => {
  vi.spyOn(AnalyticsStore.prototype, "trackInsightsStaffPageViewed");

  await presenter.hydrate();
  presenter.trackStaffPageViewed();

  expect(
    store.insightsStore.rootStore.analyticsStore.trackInsightsStaffPageViewed,
  ).toHaveBeenCalledWith({
    staffPseudonymizedId: testOfficer.pseudonymizedId,
    supervisorPseudonymizedId:
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    viewedBy: pseudoId,
    numOutlierMetrics: presenter.officerOutcomesData?.outlierMetrics.length,
  });
});

test("track metric tab viewed events", async () => {
  vi.spyOn(AnalyticsStore.prototype, "trackInsightsStaffMetricViewed");

  await presenter.hydrate();
  presenter.trackMetricViewed(testMetric.metricId);

  expect(
    store.insightsStore.rootStore.analyticsStore.trackInsightsStaffMetricViewed,
  ).toHaveBeenCalledWith({
    staffPseudonymizedId: testOfficer.pseudonymizedId,
    supervisorPseudonymizedId:
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    viewedBy: pseudoId,
    metricId: testMetric.metricId,
  });
});
