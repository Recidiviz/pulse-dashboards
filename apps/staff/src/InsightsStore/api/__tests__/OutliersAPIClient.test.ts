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

import { disableFetchMocks, enableFetchMocks } from "jest-fetch-mock";

import { RootStore } from "../../../RootStore";
import { APIStore } from "../../../RootStore/APIStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsStore } from "../../InsightsStore";
import { ADVERSE_METRIC_IDS } from "../../models/offlineFixtures/constants";
import { InsightsConfigFixture } from "../../models/offlineFixtures/InsightsConfigFixture";
import {
  metricBenchmarksFixture,
  rawMetricBenchmarksFixture,
} from "../../models/offlineFixtures/MetricBenchmarkFixture";
import {
  rawSupervisionOfficerFixture,
  supervisionOfficerFixture,
} from "../../models/offlineFixtures/SupervisionOfficerFixture";
import {
  rawSupervisionOfficerMetricEventFixture,
  supervisionOfficerMetricEventFixture,
} from "../../models/offlineFixtures/SupervisionOfficerMetricEventFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import {
  leadershipUserInfoFixture,
  rawLeadershipUserInfoFixture,
  rawSupervisorUserInfoFixture,
  supervisorUserInfoFixture,
} from "../../models/offlineFixtures/UserInfoFixture";
import { InsightsAPIClient } from "../InsightsAPIClient";

const mockTenantId = "us_tn";
const BASE_URL = `http://localhost:5000/outliers/${mockTenantId}`;
const OLD_ENV = process.env;

describe("InsightsAPIClient", () => {
  let client: InsightsAPIClient;

  beforeAll(() => {
    enableFetchMocks();
    process.env = Object.assign(process.env, {
      REACT_APP_DEPLOY_ENV: "dev",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    const mockUserStore = {
      getToken: () => Promise.resolve(""),
    } as UserStore;
    // @ts-ignore
    const mockRootStore = {
      currentTenantId: mockTenantId,
      apiStore: new APIStore(mockUserStore),
    } as RootStore;
    client = new InsightsAPIClient(new InsightsStore(mockRootStore));
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
    disableFetchMocks();
  });

  it("init calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ config: InsightsConfigFixture }));
    await client.init();
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/configuration`),
    );
  });

  it("init parses the config data", async () => {
    fetchMock.mockResponse(JSON.stringify({ config: InsightsConfigFixture }));
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

  it("userInfo parses the data for supervisor", async () => {
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
    expect(badClient.supervisionOfficerSupervisors()).rejects.toThrow(
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
});