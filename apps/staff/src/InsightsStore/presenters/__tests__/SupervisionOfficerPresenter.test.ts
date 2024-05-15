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

import { unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsConfigFixture } from "../../models/offlineFixtures/InsightsConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenter } from "../SupervisionOfficerPresenter";
import * as utils from "../utils";

let store: InsightsSupervisionStore;
const pseudoId = "hashed-mdavis123";
const testOfficer = supervisionOfficerFixture[0];
const testSupervisor = supervisionOfficerSupervisorsFixture[0];
let presenter: SupervisionOfficerPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => pseudoId,
  );
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );

  store = new InsightsSupervisionStore(
    new RootStore().insightsStore,
    InsightsConfigFixture,
  );
  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);

  presenter = new SupervisionOfficerPresenter(
    store,
    testOfficer.pseudonymizedId,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

describe("with unit data already hydrated", () => {
  beforeEach(async () => {
    await Promise.all([
      flowResult(
        store.populateOfficersForSupervisor(testSupervisor.pseudonymizedId),
      ),
      flowResult(store.populateSupervisionOfficerSupervisors()),
      flowResult(store.populateMetricConfigs()),
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

  test("has outlierOfficerData", async () => {
    expect(presenter.outlierOfficerData).toBeDefined();
    expect(presenter.outlierOfficerData).toMatchSnapshot();
  });

  test("has metricConfigs", async () => {
    expect(presenter.metricConfigsById).toBeDefined();
  });

  test("has supervisorInfo", () => {
    expect(presenter.supervisorInfo).toBeDefined();
    expect(presenter.supervisorInfo).toEqual(
      supervisionOfficerSupervisorsFixture[0],
    );
  });
});

test("hydration", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
  vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
  vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficerSupervisors");

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.insightsStore.apiClient.metricBenchmarks).toHaveBeenCalled();
  expect(store.insightsStore.apiClient.supervisionOfficer).toHaveBeenCalledWith(
    testOfficer.pseudonymizedId,
  );
  expect(
    store.insightsStore.apiClient.supervisionOfficerSupervisors,
  ).toHaveBeenCalled();
});

test("has outlierOfficerData", async () => {
  await presenter.hydrate();

  expect(presenter.outlierOfficerData).toBeDefined();
  expect(presenter.outlierOfficerData).toMatchSnapshot();
});

test("has metricConfigs", async () => {
  await presenter.hydrate();

  expect(presenter.metricConfigsById).toBeDefined();
});

test("has supervisorInfo", async () => {
  await presenter.hydrate();

  expect(presenter.supervisorInfo).toBeDefined();
  expect(presenter.supervisorInfo).toEqual(
    supervisionOfficerSupervisorsFixture[0],
  );
});

test("has timePeriod", async () => {
  await presenter.hydrate();

  const { timePeriod } = presenter;

  expect(timePeriod).toBeDefined();
  expect(timePeriod).toMatch("9/1/22 - 9/1/23");
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
  vi.spyOn(utils, "getOutlierOfficerData").mockImplementation(() => {
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
  expect(presenter.outlierOfficerData).toBeUndefined();
});
