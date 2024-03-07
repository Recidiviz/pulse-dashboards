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

import { RootStore } from "../../../RootStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsConfigFixture } from "../../models/offlineFixtures/InsightsConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerMetricEventsPresenter } from "../SupervisionOfficerMetricEventsPresenter";

let store: InsightsSupervisionStore;
let presenter: SupervisionOfficerMetricEventsPresenter;
const testOfficer = supervisionOfficerFixture[2];
const testOfficerId = testOfficer.externalId;
const testMetricId = testOfficer.outlierMetrics[0].metricId;

beforeEach(() => {
  store = new InsightsSupervisionStore(
    new RootStore().insightsStore,
    InsightsConfigFixture,
  );

  presenter = new SupervisionOfficerMetricEventsPresenter(
    store,
    testOfficerId,
    testMetricId,
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("hydrate", async () => {
  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
});

test("hydrated with no results", async () => {
  jest
    .spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficerMetricEvents")
    .mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
});

test("hydration error in dependency", async () => {
  const err = new Error("fake error");
  jest
    .spyOn(InsightsSupervisionStore.prototype, "populateMetricEventsForOfficer")
    .mockImplementation(() => {
      throw err;
    });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("events data", async () => {
  await presenter.hydrate();
  expect(presenter.officerMetricEvents).toMatchSnapshot();
});

test("events label", async () => {
  await presenter.hydrate();
  expect(presenter.eventsLabel).toMatchInlineSnapshot(`"absconsions"`);
});
