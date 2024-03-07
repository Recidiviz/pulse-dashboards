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

import { configure } from "mobx";

import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import { unpackAggregatedErrors } from "../../../testUtils";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { InsightsConfigFixture } from "../../models/offlineFixtures/InsightsConfigFixture";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficersPresenter } from "../SupervisionOfficersPresenter";
import { getOutlierOfficerData } from "../utils";

let store: InsightsSupervisionStore;
let presenter: SupervisionOfficersPresenter;
const pseudoId = "hashed-mdavis123";

jest.mock("../utils", () => {
  const original = jest.requireActual("../utils").getOutlierOfficerData;
  return {
    getOutlierOfficerData: jest.fn().mockImplementation(original),
  };
});

const getOutlierOfficerDataMock = jest.mocked(getOutlierOfficerData);

beforeEach(() => {
  jest.resetModules();
  configure({ safeDescriptors: false });
  jest
    .spyOn(UserStore.prototype, "userPseudoId", "get")
    .mockImplementation(() => pseudoId);

  jest
    .spyOn(UserStore.prototype, "isRecidivizUser", "get")
    .mockImplementation(() => false);

  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );
  jest.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);

  presenter = new SupervisionOfficersPresenter(store, pseudoId);
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("outlierOfficersData", async () => {
  await presenter.hydrate();

  const { outlierOfficersData } = presenter;
  expect(outlierOfficersData).toMatchSnapshot();
});

test("supervisorInfo", async () => {
  await presenter.hydrate();

  const { supervisorInfo } = presenter;
  expect(supervisorInfo).toMatchSnapshot();
});

test("timePeriod", async () => {
  await presenter.hydrate();

  const { timePeriod } = presenter;

  expect(timePeriod).toBeDefined();
  expect(timePeriod).toMatch("9/1/22 - 9/1/23");
});

test("hydration error in dependency", async () => {
  const err = new Error("fake error");
  jest
    .spyOn(InsightsSupervisionStore.prototype, "populateMetricConfigs")
    .mockImplementation(() => {
      throw err;
    });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("supervisorId not found in supervisionOfficerSupervisors", async () => {
  presenter = new SupervisionOfficersPresenter(store, "nonExistentId");
  await presenter.hydrate();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    Object {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);
  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    Array [
      [Error: failed to populate officers],
      [Error: failed to populate supervisor],
      [Error: Missing expected data for supervised officers],
    ]
  `);
});

test("supervisorId not found in officersBySupervisor", async () => {
  jest
    .spyOn(InsightsOfflineAPIClient.prototype, "officersForSupervisor")
    .mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    Object {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);

  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    Array [
      [Error: failed to populate officers],
      [Error: Missing expected data for supervised officers],
    ]
  `);
});

test("error assembling metrics data", async () => {
  getOutlierOfficerDataMock.mockImplementation(() => {
    throw new Error("oops");
  });

  await presenter.hydrate();

  expect(presenter.outlierOfficersData).toBeUndefined();

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
});

test("tracks events", async () => {
  jest.spyOn(AnalyticsStore.prototype, "trackInsightsSupervisorPageViewed");

  await presenter.hydrate();
  presenter.trackViewed();

  expect(
    store.insightsStore.rootStore.analyticsStore
      .trackInsightsSupervisorPageViewed,
  ).toHaveBeenCalledWith({
    supervisorPseudonymizedId: pseudoId,
    viewedBy: pseudoId,
  });
});
