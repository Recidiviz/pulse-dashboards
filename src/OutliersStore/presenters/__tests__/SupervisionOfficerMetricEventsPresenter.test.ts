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
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { OutliersSupervisionStore } from "../../stores/OutliersSupervisionStore";
import { SupervisionOfficerMetricEventsPresenter } from "../SupervisionOfficerMetricEventsPresenter";

let store: OutliersSupervisionStore;
let presenter: SupervisionOfficerMetricEventsPresenter;
const testOfficer = supervisionOfficerFixture[2];
const testOfficerId = testOfficer.externalId;
const testMetricId = testOfficer.outlierMetrics[0].metricId;

beforeEach(() => {
  store = new OutliersSupervisionStore(
    new RootStore().outliersStore,
    OutliersConfigFixture
  );

  presenter = new SupervisionOfficerMetricEventsPresenter(
    store,
    testOfficerId,
    testMetricId
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("hydrate", async () => {
  expect(presenter.isHydrated).toBe(false);

  await presenter.hydrate();

  expect(presenter.isHydrated).toBe(true);
});

test("hydrated with no results", async () => {
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "supervisionOfficerMetricEvents")
    .mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.isHydrated).toBe(true);
});

test("hydration error in dependency", async () => {
  const err = new Error("fake error");
  jest
    .spyOn(OutliersSupervisionStore.prototype, "hydrateMetricEventsForOfficer")
    .mockImplementation(() => {
      throw err;
    });

  await presenter.hydrate();
  expect(presenter.error).toEqual(err);
});

test("events data", async () => {
  await presenter.hydrate();
  expect(presenter.officerMetricEvents).toMatchSnapshot();
});

test("events label", async () => {
  await presenter.hydrate();
  expect(presenter.eventsLabel).toMatchInlineSnapshot(`"absconsions"`);
});