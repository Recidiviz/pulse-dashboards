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
import { SupervisionOfficerVitalsPresenter } from "../SupervisionOfficerVitalsPresenter";

let store: InsightsSupervisionStore;
const pseudoId = "hashed-agonzalez123";
const testOfficerPseudoId = supervisionOfficerFixture[0].pseudonymizedId;

beforeEach(() => {
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => pseudoId,
  );
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  const rootStore = new RootStore();
  store = new InsightsSupervisionStore(
    rootStore.insightsStore,
    InsightsConfigFixture,
  );
  store.setOfficerPseudoId(testOfficerPseudoId);
  const { workflowsRootStore } = rootStore;
  workflowsRootStore.populateJusticeInvolvedPersonsStore();
  if (workflowsRootStore.justiceInvolvedPersonsStore) {
    presenter = new SupervisionOfficerVitalsPresenter(
      store,
      workflowsRootStore.justiceInvolvedPersonsStore,
      testOfficerPseudoId,
    );
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

let presenter: SupervisionOfficerVitalsPresenter;

describe("with vitals data already hydrated", () => {
  beforeEach(async () => {
    await Promise.all([flowResult(presenter.populateVitalsForOfficer())]);
  });

  test("is immediately hydrated", () => {
    expect(presenter.hydrationState.status).toBe("hydrated");
    expect(presenter.officerVitalsMetrics).toMatchInlineSnapshot(`
      [
        {
          "metricId": "timely_contact",
          "vitalsMetrics": [
            {
              "metric30DDelta": -7,
              "metricValue": 87,
              "officerPseudonymizedId": "hashed-so1",
            },
          ],
        },
        {
          "metricId": "timely_risk_assessment",
          "vitalsMetrics": [
            {
              "metric30DDelta": -4,
              "metricValue": 99,
              "officerPseudonymizedId": "hashed-so1",
            },
          ],
        },
      ]
    `);
  });

  test("makes no additional API calls", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForOfficer");

    await presenter.hydrate();

    expect(
      store.insightsStore.apiClient.vitalsForOfficer,
    ).not.toHaveBeenCalled();
  });
});

test("vitalsMetricDetails when there are no VitalsMetricForOfficer for a metric", () => {
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId: testOfficerPseudoId,
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
      {
        metricId: "timely_risk_assessment",
        vitalsMetrics: [],
      },
    ],
  );
  expect(presenter.vitalsMetricDetails).toMatchInlineSnapshot(`
    [
      {
        "bodyDisplayName": "Contact",
        "metric30DDelta": 1,
        "metricId": "timely_contact",
        "metricValue": 99,
        "officerPseudonymizedId": "hashed-so1",
        "tasks": [],
        "titleDisplayName": "Timely Contact",
      },
    ]
  `);
});

test("vitalsMetricDetails when an officer supervises themself", () => {
  store.vitalsMetricsBySupervisorPseudoId.set(testOfficerPseudoId, [
    {
      metricId: "timely_contact",
      vitalsMetrics: [
        {
          officerPseudonymizedId: testOfficerPseudoId,
          metric30DDelta: 1,
          metricValue: 99,
        },
        {
          officerPseudonymizedId: supervisionOfficerFixture[1].pseudonymizedId,
          metric30DDelta: 2,
          metricValue: 98,
        },
      ],
    },
    {
      metricId: "timely_risk_assessment",
      vitalsMetrics: [
        {
          officerPseudonymizedId: supervisionOfficerFixture[2].pseudonymizedId,
          metric30DDelta: 3,
          metricValue: 97,
        },
      ],
    },
  ]);
  expect(presenter.vitalsMetricDetails).toMatchInlineSnapshot(`
    [
      {
        "bodyDisplayName": "Contact",
        "metric30DDelta": 1,
        "metricId": "timely_contact",
        "metricValue": 99,
        "officerPseudonymizedId": "hashed-so1",
        "tasks": [],
        "titleDisplayName": "Timely Contact",
      },
    ]
  `);
});

test("vitalsMetricDetails when officer not found", () => {
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    [
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
    ],
  );
  expect(presenter.vitalsMetricDetails).toMatchInlineSnapshot(`[]`);
});

test("vitalsmetricDetails when an officer has multiple supervisors", () => {
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId: testOfficerPseudoId,
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
    ],
  );
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[1].pseudonymizedId,
    [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId: testOfficerPseudoId,
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
    ],
  );
  expect(presenter.vitalsMetricDetails).toMatchInlineSnapshot(`
    [
      {
        "bodyDisplayName": "Contact",
        "metric30DDelta": 1,
        "metricId": "timely_contact",
        "metricValue": 99,
        "officerPseudonymizedId": "hashed-so1",
        "tasks": [],
        "titleDisplayName": "Timely Contact",
      },
    ]
  `);
});

test("vitalsmetricDetails when an officer has multiple supervisors with different values for the officer", () => {
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId: testOfficerPseudoId,
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
    ],
  );
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[1].pseudonymizedId,
    [
      {
        metricId: "timely_contact",
        vitalsMetrics: [
          {
            officerPseudonymizedId: testOfficerPseudoId,
            metric30DDelta: 1,
            metricValue: 60,
          },
        ],
      },
    ],
  );
  expect(
    () => presenter.vitalsMetricDetails,
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Found mismatched metric values for metric timely_contact for officer pseudo ID hashed-so1]`,
  );
});

test("throw an error when vitalsMetricDetails does not find a vitalsMetricConfig for a metricId", () => {
  store.vitalsMetricsBySupervisorPseudoId.set(
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    [
      {
        // @ts-ignore
        metricId: "fake_id",
        vitalsMetrics: [
          {
            officerPseudonymizedId: testOfficerPseudoId,
            metric30DDelta: 1,
            metricValue: 99,
          },
        ],
      },
    ],
  );
  expect(
    () => presenter.vitalsMetricDetails,
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Missing configuration for metric fake_id]`,
  );
});

test("hydration", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "vitalsForOfficer");

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.insightsStore.apiClient.vitalsForOfficer).toHaveBeenCalled();
});
