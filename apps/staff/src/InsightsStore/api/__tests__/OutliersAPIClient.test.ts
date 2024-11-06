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
  rawSupervisionOfficerVitalsMetricFixture,
  rawSupervisorUserInfoFixture,
  supervisionOfficerFixture,
  supervisionOfficerMetricEventFixture,
  supervisionOfficerSupervisorsFixture,
  supervisionOfficerVitalsMetricFixture,
  supervisorUserInfoFixture,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { APIStore } from "../../../RootStore/APIStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsStore } from "../../InsightsStore";
import { InsightsAPIClient } from "../InsightsAPIClient";

const mockTenantId = "us_tn";
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
    // @ts-ignore
    const mockRootStore = {
      currentTenantId: mockTenantId,
      apiStore: new APIStore(mockUserStore),
      userStore: mockUserStore,
    } as RootStore;
    client = new InsightsAPIClient(new InsightsStore(mockRootStore));
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
      JSON.stringify({ events: rawSupervisionOfficerVitalsMetricFixture }),
    );
    const response = await client.vitalsForSupervisor(
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    );

    expect(response).toEqual(supervisionOfficerVitalsMetricFixture.slice(0, 3));
  });
});
