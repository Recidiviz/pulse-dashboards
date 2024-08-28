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

import { parseISO } from "date-fns";
import { flowResult } from "mobx";

import { InsightsConfigFixture } from "~datatypes";

import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerMetricEventFixture } from "../../models/offlineFixtures/SupervisionOfficerMetricEventFixture";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionClientDetailPresenter } from "../SupervisionClientDetailPresenter";

let store: InsightsSupervisionStore;
const pseudoId = "hashed-agonzalez123";
const clientPseudoId = "hashed-985771";
const endDate = "2023-05-01";

beforeEach(() => {
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
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);
  store.setMetricId(testMetric.metricId);
  store.setClientPseudoId(clientPseudoId);
  store.setOutcomeDate(endDate);

  presenter = new SupervisionClientDetailPresenter(
    store,
    testOfficer.pseudonymizedId,
    clientPseudoId,
    testMetric.metricId,
    new Date(endDate),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

const testOfficer = supervisionOfficerFixture[0];
const testMetric = testOfficer.outlierMetrics[0];
let presenter: SupervisionClientDetailPresenter;

describe("with client data already hydrated", () => {
  beforeEach(async () => {
    await Promise.all([
      flowResult(
        store.populateClientEventsForClient(clientPseudoId, parseISO(endDate)),
      ),
      flowResult(store.populateClientInfoForClient(clientPseudoId)),
    ]);
  });

  test("is immediately hydrated", () => {
    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("makes no additional API calls", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "clientEvents");
    vi.spyOn(InsightsOfflineAPIClient.prototype, "clientInfo");

    await presenter.hydrate();

    expect(store.insightsStore.apiClient.clientEvents).not.toHaveBeenCalled();
    expect(store.insightsStore.apiClient.clientInfo).not.toHaveBeenCalled();
  });

  test("has clientEvents", () => {
    expect(presenter.clientEvents).toBeDefined();
    expect(presenter.clientEvents).toMatchSnapshot();
  });

  test("has clientInfo", async () => {
    expect(presenter.clientInfo).toBeDefined();
    expect(presenter.clientInfo).toMatchSnapshot();
  });
});

test("hydration", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "clientEvents");
  vi.spyOn(InsightsOfflineAPIClient.prototype, "clientInfo");

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.insightsStore.apiClient.clientEvents).toHaveBeenCalled();
  expect(store.insightsStore.apiClient.clientInfo).toHaveBeenCalled();
});

test("has clientEvents", async () => {
  await presenter.hydrate();

  expect(presenter.clientEvents).toBeDefined();
  expect(presenter.clientEvents).toMatchSnapshot();
});

test("has clientInfo", async () => {
  await presenter.hydrate();

  expect(presenter.clientInfo).toBeDefined();
  expect(presenter.clientInfo).toMatchSnapshot();
});

test("has supervisionDetails if metric event date matches outcomeDate", async () => {
  const officerMetricEventDate = supervisionOfficerMetricEventFixture.find(
    (e) => {
      return (
        e.pseudonymizedClientId === clientPseudoId &&
        e.metricId === testMetric.metricId
      );
    },
  )?.eventDate;
  store.setOutcomeDate(officerMetricEventDate?.toISOString());

  if (store.outcomeDate)
    presenter = new SupervisionClientDetailPresenter(
      store,
      testOfficer.pseudonymizedId,
      clientPseudoId,
      testMetric.metricId,
      store.outcomeDate,
    );
  await presenter.hydrate();

  expect(presenter.supervisionDetails).toBeDefined();
  expect(presenter.supervisionDetails).toMatchSnapshot();
});

test("supervisionDetails is undefined if metric event date does not match outcomeDate", async () => {
  // bogus outcome date
  store.setOutcomeDate("2000-01-01");
  await presenter.hydrate();

  expect(presenter.supervisionDetails).not.toBeDefined();
});

test("hydration error in dependency", async () => {
  const err = new Error("fake error");
  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "populateClientInfoForClient",
  ).mockImplementation(() => {
    throw err;
  });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("tracks events", async () => {
  vi.spyOn(AnalyticsStore.prototype, "trackInsightsClientPageViewed");

  await presenter.hydrate();
  presenter.trackViewed();

  expect(
    store.insightsStore.rootStore.analyticsStore.trackInsightsClientPageViewed,
  ).toHaveBeenCalledWith({
    clientPseudonymizedId: presenter.clientPseudoId,
    outcomeDate: new Date(endDate),
    viewedBy: pseudoId,
  });
});
