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

import { flowResult } from "mobx";

import {
  InsightsConfigFixture,
  supervisionOfficerFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorVitalsPresenter } from "../SupervisionSupervisorVitalsPresenter";

let store: InsightsSupervisionStore;
const pseudoId = "hashed-agonzalez123";

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
  const testSupervisorPseudoId =
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId;

  presenter = new SupervisionSupervisorVitalsPresenter(
    store,
    testSupervisorPseudoId,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

let presenter: SupervisionSupervisorVitalsPresenter;

describe("with vitals data already hydrated", () => {
  beforeEach(async () => {
    await Promise.all([
      flowResult(
        store.populateVitalsForSupervisor(presenter.supervisorPseudoId),
      ),
      flowResult(
        store.populateOfficersForSupervisor(presenter.supervisorPseudoId),
      ),
    ]);
  });

  test("is immediately hydrated", () => {
    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("makes no additional API calls", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForSupervisor");

    await presenter.hydrate();

    expect(
      store.insightsStore.apiClient.vitalsForSupervisor,
    ).not.toHaveBeenCalled();
  });

  test("has vitalsMetricDetails", () => {
    expect(presenter.vitalsMetricDetails).toBeDefined();
    expect(presenter.vitalsMetricDetails).toMatchSnapshot();
  });

  test("vitalsMetricDetails when there are no VitalsMetricForOfficer for a metric", () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForSupervisor");
    store.vitalsMetricsBySupervisorPseudoId.set(pseudoId, [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId:
              supervisionOfficerFixture[0].pseudonymizedId,
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
    ]);
    expect(presenter.vitalsMetricDetails).toMatchInlineSnapshot(`
      [
        {
          "officersWithMetricValues": [
            {
              "displayName": "Walter Harris",
              "metric30DDelta": 1,
              "metricValue": 99,
              "officerPseudonymizedId": "hashed-so1",
            },
          ],
          "titleDisplayName": "Timely Contact",
        },
      ]
    `);
  });

  test("vitalsMetricDetails when officer not found", () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForSupervisor");
    store.vitalsMetricsBySupervisorPseudoId.set(pseudoId, [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId: "not-a-real-id",
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
    ]);
    expect(presenter.vitalsMetricDetails).toMatchInlineSnapshot(`
      [
        {
          "officersWithMetricValues": [],
          "titleDisplayName": "Timely Contact",
        },
      ]
    `);
  });
});

test("throw an when vitalsMetricDetails does not find a vitalsMetricConfig for a metricId", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForOfficer");

  store.vitalsMetricsBySupervisorPseudoId.set(pseudoId, [
    {
      // @ts-ignore
      metricId: "fake_id",
      vitalsMetrics: [
        {
          officerPseudonymizedId: supervisionOfficerFixture[0].pseudonymizedId,
          metric30DDelta: 1,
          metricValue: 99,
        },
      ],
    },
  ]);

  expect(
    () => presenter.vitalsMetricDetails,
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Missing configuration for metric fake_id]`,
  );
});

test("hydration", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForSupervisor");

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.insightsStore.apiClient.vitalsForSupervisor).toHaveBeenCalled();
});
