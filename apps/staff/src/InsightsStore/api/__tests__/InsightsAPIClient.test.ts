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

import {
  actionStrategyFixture,
  ADVERSE_METRIC_IDS,
  excludedSupervisionOfficerFixture,
  InsightsConfigFixture,
  leadershipUserInfoFixture,
  metricBenchmarksFixture,
  rawActionStrategyFixture,
  rawExcludedSupervisionOfficerFixture,
  rawInsightsConfigFixture,
  rawLeadershipUserInfoFixture,
  rawMetricBenchmarksFixture,
  rawSupervisionOfficerFixture,
  rawSupervisionOfficerMetricEventFixture,
  rawSupervisionOfficerOutcomesFixture,
  rawSupervisionVitalsMetricFixture,
  rawSupervisorUserInfoFixture,
  supervisionOfficerFixture,
  supervisionOfficerMetricEventFixture,
  supervisionOfficerOutcomesFixture,
  supervisionOfficerSupervisorsFixture,
  supervisorUserInfoFixture,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { APIStore } from "../../../RootStore/APIStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsStore } from "../../InsightsStore";
import { InsightsAPIClient } from "../InsightsAPIClient";

const mockTenantId = "US_TN";
const BASE_URL = `http://localhost:5000/outliers/${mockTenantId}`;

describe("InsightsAPIClient", () => {
  let client: InsightsAPIClient;

  beforeEach(() => {
    vi.stubEnv("VITE_DEPLOY_ENV", "dev");
    vi.stubEnv("VITE_NEW_BACKEND_API_URL", "http://localhost:5000");
    const mockUserStore = {
      getToken: () => Promise.resolve(""),
      user: {},
    } as UserStore;
    const rootStore = new RootStore();
    rootStore.tenantStore.setCurrentTenantId(mockTenantId);
    rootStore.apiStore = new APIStore(mockUserStore);
    rootStore.userStore = mockUserStore;
    const insightsStore = new InsightsStore(rootStore);
    client = new InsightsAPIClient(insightsStore);
  });

  it("init calls the correct endpoint", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ config: rawInsightsConfigFixture }),
    );
    await client.init();
    expect(fetchMock.requests()[0].url).toEqual(
      encodeURI(`${BASE_URL}/configuration`),
    );
  });

  it("init parses the config data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ config: rawInsightsConfigFixture }),
    );
    const response = await client.init();
    expect(response).toEqual(InsightsConfigFixture);
  });

  it("userInfo calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify(rawSupervisorUserInfoFixture));
    const pseudoId = "fake-pseudo-id";
    await client.userInfo(pseudoId);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/user-info/${pseudoId}`),
    );
  });

  it("userInfo parses the data for supervisor", async () => {
    fetchMock.mockResponse(JSON.stringify(rawSupervisorUserInfoFixture));
    const response = await client.userInfo("fake-pseudo-id");
    expect(response).toEqual(supervisorUserInfoFixture);
  });

  it("userInfo parses the data for leadership", async () => {
    fetchMock.mockResponse(JSON.stringify(rawLeadershipUserInfoFixture));
    const response = await client.userInfo("fake-pseudo-id");
    expect(response).toEqual(leadershipUserInfoFixture);
  });

  it("patchUserInfo parses the data for supervisor", async () => {
    // We can't test that the API actually modified anything here, but since it returns the updated
    // result we can at least test that it correctly parses the updated result.
    fetchMock.mockResponse(JSON.stringify(rawSupervisorUserInfoFixture));
    const response = await client.patchUserInfo("fake-pseudo-id", {
      hasSeenOnboarding: false,
    });
    expect(response).toEqual(supervisorUserInfoFixture);
  });

  it("patchUserInfo parses the data for leadership", async () => {
    // We can't test that the API actually modified anything here, but since it returns the updated
    // result we can at least test that it correctly parses the updated result.
    fetchMock.mockResponse(JSON.stringify(rawLeadershipUserInfoFixture));
    const response = await client.patchUserInfo("fake-pseudo-id", {
      hasSeenOnboarding: false,
    });
    expect(response).toEqual(leadershipUserInfoFixture);
  });

  it("supervisionOfficerSupervisors calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ supervisors: [] }));
    await client.supervisionOfficerSupervisors();
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/supervisors`),
    );
  });

  it("supervisionOfficerSupervisors parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ supervisors: supervisionOfficerSupervisorsFixture }),
    );
    const response = await client.supervisionOfficerSupervisors();
    expect(response).toEqual(supervisionOfficerSupervisorsFixture);
  });

  it("supervisionOfficerSupervisors throws error if tenantId is undefined", async () => {
    // @ts-ignore
    const mockRootStore = {
      currentTenantId: undefined,
    } as RootStore;
    const badClient = new InsightsAPIClient(new InsightsStore(mockRootStore));
    await expect(badClient.supervisionOfficerSupervisors()).rejects.toThrow(
      "Attempted to fetch data with undefined tenantId",
    );
  });

  it("metricBenchmarks calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ metrics: [] }));
    await client.metricBenchmarks();
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/benchmarks`),
    );
  });

  it("metricBenchmarks parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ metrics: rawMetricBenchmarksFixture }),
    );
    const response = await client.metricBenchmarks();
    expect(response).toEqual(metricBenchmarksFixture);
  });

  it("officersForSupervisor calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ officers: [] }));
    await client.officersForSupervisor("any-hashed-id");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/supervisor/any-hashed-id/officers`),
    );
  });

  it("officersForSupervisor parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ officers: rawSupervisionOfficerFixture }),
    );
    const response = await client.officersForSupervisor(
      supervisionOfficerSupervisorsFixture[0].externalId,
    );

    expect(response).toEqual(supervisionOfficerFixture);
  });

  it("outcomesForSupervisor calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ outcomes: [] }));
    await client.outcomesForSupervisor("any-hashed-id");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/supervisor/any-hashed-id/outcomes`),
    );
  });

  it("outcomesForSupervisor parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ outcomes: rawSupervisionOfficerOutcomesFixture }),
    );
    const response = await client.outcomesForSupervisor(
      supervisionOfficerSupervisorsFixture[0].externalId,
    );

    expect(response).toEqual(supervisionOfficerOutcomesFixture);
  });

  it("supervisionOfficer calls the correct endpoint", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ officer: rawSupervisionOfficerFixture[0] }),
    );
    await client.supervisionOfficer("any-hashed-id");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/officer/any-hashed-id`),
    );
  });

  it("supervisionOfficer parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ officer: rawSupervisionOfficerFixture[0] }),
    );
    const response = await client.supervisionOfficer(
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    );

    expect(response).toEqual(supervisionOfficerFixture[0]);
  });

  it("excludedSupervisionOfficer calls the correct endpoint", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ officer: rawExcludedSupervisionOfficerFixture[0] }),
    );
    await client.excludedSupervisionOfficer("any-hashed-id");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/excluded_officer/any-hashed-id`),
    );
  });

  it("excludedSupervisionOfficer parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ officer: rawExcludedSupervisionOfficerFixture[0] }),
    );
    const response = await client.excludedSupervisionOfficer(
      rawExcludedSupervisionOfficerFixture[0].pseudonymizedId,
    );

    expect(response).toEqual(excludedSupervisionOfficerFixture[0]);
  });

  it("supervisionOfficerOutcomes calls the correct endpoint", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ outcomes: rawSupervisionOfficerOutcomesFixture[0] }),
    );
    await client.outcomesForOfficer("any-hashed-id");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/officer/any-hashed-id/outcomes`),
    );
  });

  it("supervisionOfficerOutcomes parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ outcomes: rawSupervisionOfficerOutcomesFixture[0] }),
    );
    const response = await client.outcomesForOfficer("any-hashed-officer-id");

    expect(response).toEqual(supervisionOfficerOutcomesFixture[0]);
  });

  it("supervisionOfficerMetricEvents calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ events: [] }));
    await client.supervisionOfficerMetricEvents("any-hashed-id", "metricID");
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/officer/any-hashed-id/events?metric_id=metricID`),
    );
  });

  it("supervisionOfficerMetricEvents parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ events: rawSupervisionOfficerMetricEventFixture }),
    );
    const response = await client.supervisionOfficerMetricEvents(
      supervisionOfficerSupervisorsFixture[0].externalId,
      ADVERSE_METRIC_IDS.enum.incarceration_starts,
    );

    expect(response).toEqual(supervisionOfficerMetricEventFixture);
  });

  it("actionStrategies parses the data", async () => {
    fetchMock.mockResponse(JSON.stringify(rawActionStrategyFixture));
    const response = await client.actionStrategies("fake-pseudo-id");
    expect(response).toEqual(actionStrategyFixture);
  });

  it("vitalsForSupervisor parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ events: rawSupervisionVitalsMetricFixture }),
    );
    const response = await client.vitalsForSupervisor(
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    );

    expect(response).toMatchInlineSnapshot(`
      [
        {
          "metricId": "timely_contact",
          "vitalsMetrics": [
            {
              "metric30DDelta": -7,
              "metricValue": 87,
              "officerPseudonymizedId": "hashed-so1",
            },
            {
              "metric30DDelta": -1,
              "metricValue": 57,
              "officerPseudonymizedId": "hashed-so2",
            },
            {
              "metric30DDelta": 1.2,
              "metricValue": 31,
              "officerPseudonymizedId": "hashed-so3",
            },
            {
              "metric30DDelta": 5.9,
              "metricValue": 79,
              "officerPseudonymizedId": "hashed-so9",
            },
            {
              "metric30DDelta": 1.5,
              "metricValue": 89,
              "officerPseudonymizedId": "hashed-so10",
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
            {
              "metric30DDelta": -1.7,
              "metricValue": 86,
              "officerPseudonymizedId": "hashed-so2",
            },
            {
              "metric30DDelta": 0.7,
              "metricValue": 97,
              "officerPseudonymizedId": "hashed-so3",
            },
            {
              "metric30DDelta": 0,
              "metricValue": 100,
              "officerPseudonymizedId": "hashed-so9",
            },
            {
              "metric30DDelta": -3.4,
              "metricValue": 79,
              "officerPseudonymizedId": "hashed-so10",
            },
          ],
        },
      ]
    `);
  });

  it("vitalsForOfficer parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ events: rawSupervisionVitalsMetricFixture }),
    );
    const response = await client.vitalsForOfficer(
      supervisionOfficerFixture[0].pseudonymizedId,
    );

    expect(response).toMatchInlineSnapshot(`
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
});
