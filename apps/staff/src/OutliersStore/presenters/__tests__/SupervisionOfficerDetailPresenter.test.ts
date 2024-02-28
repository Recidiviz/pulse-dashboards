// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import { unpackAggregatedErrors } from "../../../testUtils";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersSupervisionStore } from "../../stores/OutliersSupervisionStore";
import { SupervisionOfficerDetailPresenter } from "../SupervisionOfficerDetailPresenter";
import { getOutlierOfficerData } from "../utils";

let store: OutliersSupervisionStore;
const pseudoId = "hashed-mdavis123";

jest.mock("../utils", () => {
  const original = jest.requireActual("../utils").getOutlierOfficerData;
  return {
    getOutlierOfficerData: jest.fn().mockImplementation(original),
  };
});

const getOutlierOfficerDataMock = getOutlierOfficerData as jest.MockedFunction<
  typeof getOutlierOfficerData
>;

beforeEach(() => {
  configure({ safeDescriptors: false });
  jest
    .spyOn(UserStore.prototype, "userPseudoId", "get")
    .mockImplementation(() => pseudoId);
  jest
    .spyOn(UserStore.prototype, "isRecidivizUser", "get")
    .mockImplementation(() => false);

  store = new OutliersSupervisionStore(
    new RootStore().outliersStore,
    OutliersConfigFixture,
  );
  jest.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);
  store.setMetricId(testMetric.metricId);

  presenter = new SupervisionOfficerDetailPresenter(
    store,
    testOfficer.pseudonymizedId,
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

const testOfficer = supervisionOfficerFixture[0];
const testMetric = testOfficer.outlierMetrics[0];
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
    ]);
  });

  test("is immediately hydrated", () => {
    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("makes no additional API calls", async () => {
    jest.spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks");
    jest.spyOn(OutliersOfflineAPIClient.prototype, "supervisionOfficer");
    jest.spyOn(
      OutliersOfflineAPIClient.prototype,
      "supervisionOfficerSupervisors",
    );
    jest.spyOn(
      OutliersOfflineAPIClient.prototype,
      "supervisionOfficerMetricEvents",
    );

    await presenter.hydrate();

    expect(
      store.outliersStore.apiClient.metricBenchmarks,
    ).not.toHaveBeenCalled();
    expect(
      store.outliersStore.apiClient.supervisionOfficerSupervisors,
    ).not.toHaveBeenCalled();
    expect(
      store.outliersStore.apiClient.supervisionOfficer,
    ).not.toHaveBeenCalled();
    expect(
      store.outliersStore.apiClient.supervisionOfficerMetricEvents,
    ).not.toHaveBeenCalled();
  });

  test("has outlierOfficerData", async () => {
    expect(presenter.outlierOfficerData).toBeDefined();
    expect(presenter.outlierOfficerData).toMatchSnapshot();
  });

  test("has metricInfo", async () => {
    expect(presenter.metricId).toEqual(testMetric.metricId);
    expect(presenter.metricInfo).toBeDefined();
  });

  test("has supervisorInfo", () => {
    expect(presenter.supervisorInfo).toBeDefined();
    expect(presenter.supervisorInfo).toEqual(
      supervisionOfficerSupervisorsFixture[0],
    );
  });
});

test("hydration", async () => {
  jest.spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks");
  jest.spyOn(OutliersOfflineAPIClient.prototype, "supervisionOfficer");
  jest.spyOn(
    OutliersOfflineAPIClient.prototype,
    "supervisionOfficerSupervisors",
  );
  jest.spyOn(
    OutliersOfflineAPIClient.prototype,
    "supervisionOfficerMetricEvents",
  );

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.outliersStore.apiClient.metricBenchmarks).toHaveBeenCalled();
  expect(store.outliersStore.apiClient.supervisionOfficer).toHaveBeenCalledWith(
    testOfficer.pseudonymizedId,
  );
  expect(
    store.outliersStore.apiClient.supervisionOfficerMetricEvents,
  ).toHaveBeenCalledWith(testOfficer.pseudonymizedId, testMetric.metricId);
  expect(
    store.outliersStore.apiClient.supervisionOfficerSupervisors,
  ).toHaveBeenCalled();
});

test("has outlierOfficerData", async () => {
  await presenter.hydrate();

  expect(presenter.outlierOfficerData).toBeDefined();
  expect(presenter.outlierOfficerData).toMatchSnapshot();
});

test("has metricInfo", async () => {
  await presenter.hydrate();

  expect(presenter.metricInfo?.name).toEqual(testMetric.metricId);
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
  jest
    .spyOn(OutliersSupervisionStore.prototype, "populateMetricConfigs")
    .mockImplementation(() => {
      throw err;
    });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("error assembling metrics data", async () => {
  getOutlierOfficerDataMock.mockImplementation(() => {
    throw new Error("oops");
  });

  await presenter.hydrate();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    Object {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);
  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    Array [
      [Error: oops],
    ]
  `);
  expect(presenter.outlierOfficerData).toBeUndefined();
});

test("tracks events", async () => {
  jest.spyOn(AnalyticsStore.prototype, "trackOutliersStaffPageViewed");

  await presenter.hydrate();
  presenter.trackViewed();

  expect(
    store.outliersStore.rootStore.analyticsStore.trackOutliersStaffPageViewed,
  ).toHaveBeenCalledWith({
    staffPseudonymizedId: testOfficer.pseudonymizedId,
    supervisorPseudonymizedId:
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    viewedBy: pseudoId,
    numOutlierMetrics: presenter.outlierOfficerData?.outlierMetrics.length,
  });
});
