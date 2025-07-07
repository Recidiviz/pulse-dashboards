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

import AxiosMockAdapter from "axios-mock-adapter";

import {
  actionStrategyFixture,
  ADVERSE_METRIC_IDS,
  InsightsConfigFixture,
  leadershipUserInfoFixture,
  metricBenchmarksFixture,
  rawActionStrategyFixture,
  rawInsightsConfigFixture,
  rawLeadershipUserInfoFixture,
  rawMetricBenchmarksFixture,
  rawRosterChangeRequestFixtures,
  rawRosterChangeRequestResponseFixture,
  rawSupervisionOfficerFixture,
  rawSupervisionOfficerMetricEventFixture,
  rawSupervisionOfficerOutcomesFixture,
  rawSupervisionVitalsMetricFixture,
  rawSupervisorUserInfoFixture,
  rosterChangeRequestFixtures,
  rosterChangeRequestResponseFixture,
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
let mockAxios: AxiosMockAdapter;

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
    mockAxios = new AxiosMockAdapter(rootStore.apiStore.client);
    rootStore.userStore = mockUserStore;
    const insightsStore = new InsightsStore(rootStore);
    client = new InsightsAPIClient(insightsStore);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  it("init calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, { config: rawInsightsConfigFixture });
    await client.init();
    expect(mockAxios.history[0].url).toEqual(
      encodeURI(`${BASE_URL}/configuration`),
    );
  });

  it("init parses the config data", async () => {
    mockAxios.onGet().replyOnce(200, { config: rawInsightsConfigFixture });
    const response = await client.init();
    expect(response).toEqual(InsightsConfigFixture);
  });

  it("userInfo calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, rawSupervisorUserInfoFixture);
    const pseudoId = "fake-pseudo-id";
    await client.userInfo(pseudoId);
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/user-info/${pseudoId}`),
    );
  });

  it("userInfo parses the data for supervisor", async () => {
    mockAxios.onGet().replyOnce(200, rawSupervisorUserInfoFixture);
    const response = await client.userInfo("fake-pseudo-id");
    expect(response).toEqual(supervisorUserInfoFixture);
  });

  it("userInfo parses the data for leadership", async () => {
    mockAxios.onGet().replyOnce(200, rawLeadershipUserInfoFixture);
    const response = await client.userInfo("fake-pseudo-id");
    expect(response).toEqual(leadershipUserInfoFixture);
  });

  it("patchUserInfo parses the data for supervisor", async () => {
    // We can't test that the API actually modified anything here, but since it returns the updated
    // result we can at least test that it correctly parses the updated result.
    mockAxios.onPatch().replyOnce(200, rawSupervisorUserInfoFixture);
    const response = await client.patchUserInfo("fake-pseudo-id", {
      hasSeenOnboarding: false,
    });
    expect(response).toEqual(supervisorUserInfoFixture);
  });

  it("patchUserInfo parses the data for leadership", async () => {
    // We can't test that the API actually modified anything here, but since it returns the updated
    // result we can at least test that it correctly parses the updated result.
    mockAxios.onPatch().replyOnce(200, rawLeadershipUserInfoFixture);
    const response = await client.patchUserInfo("fake-pseudo-id", {
      hasSeenOnboarding: false,
    });
    expect(response).toEqual(leadershipUserInfoFixture);
  });

  it("supervisionOfficerSupervisors calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, { supervisors: [] });
    await client.supervisionOfficerSupervisors();
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/supervisors`),
    );
  });

  it("supervisionOfficerSupervisors parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { supervisors: supervisionOfficerSupervisorsFixture });
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
    mockAxios.onGet().replyOnce(200, { metrics: [] });
    await client.metricBenchmarks();
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/benchmarks`),
    );
  });

  it("metricBenchmarks parses the data", async () => {
    mockAxios.onGet().replyOnce(200, { metrics: rawMetricBenchmarksFixture });
    const response = await client.metricBenchmarks();
    expect(response).toEqual(metricBenchmarksFixture);
  });

  it("officersForSupervisor calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, { officers: [] });
    await client.officersForSupervisor("any-hashed-id");
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/supervisor/any-hashed-id/officers`),
    );
  });

  it("officersForSupervisor parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { officers: rawSupervisionOfficerFixture });
    const response = await client.officersForSupervisor(
      supervisionOfficerSupervisorsFixture[0].externalId,
    );
    expect(response).toEqual(supervisionOfficerFixture);
  });

  it("outcomesForSupervisor calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, { outcomes: [] });
    await client.outcomesForSupervisor("any-hashed-id");
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/supervisor/any-hashed-id/outcomes`),
    );
  });

  it("outcomesForSupervisor parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { outcomes: rawSupervisionOfficerOutcomesFixture });
    const response = await client.outcomesForSupervisor(
      supervisionOfficerSupervisorsFixture[0].externalId,
    );
    expect(response).toEqual(supervisionOfficerOutcomesFixture);
  });

  it("allSupervisionOfficers parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { officers: rawSupervisionOfficerFixture });
    const response = await client.allSupervisionOfficers();
    expect(response).toEqual(supervisionOfficerFixture);
  });

  it("allSupervisionOfficers calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, { officers: [] });
    await client.allSupervisionOfficers();
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/officers`),
    );
  });

  it("supervisionOfficer calls the correct endpoint", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { officer: rawSupervisionOfficerFixture[0] });
    await client.supervisionOfficer("any-hashed-id");
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/officer/any-hashed-id`),
    );
  });

  it("supervisionOfficer parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { officer: rawSupervisionOfficerFixture[0] });
    const response = await client.supervisionOfficer(
      supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
    );
    expect(response).toEqual(supervisionOfficerFixture[0]);
  });

  it("supervisionOfficerOutcomes calls the correct endpoint", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { outcomes: rawSupervisionOfficerOutcomesFixture[0] });
    await client.outcomesForOfficer("any-hashed-id");
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/officer/any-hashed-id/outcomes`),
    );
  });

  it("supervisionOfficerOutcomes parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { outcomes: rawSupervisionOfficerOutcomesFixture[0] });
    const response = await client.outcomesForOfficer("any-hashed-officer-id");
    expect(response).toEqual(supervisionOfficerOutcomesFixture[0]);
  });

  it("supervisionOfficerMetricEvents calls the correct endpoint", async () => {
    mockAxios.onGet().replyOnce(200, { events: [] });
    await client.supervisionOfficerMetricEvents("any-hashed-id", "metricID");
    expect(mockAxios.history.get[0].url).toEqual(
      encodeURI(`${BASE_URL}/officer/any-hashed-id/events?metric_id=metricID`),
    );
  });

  it("supervisionOfficerMetricEvents parses the data", async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { events: rawSupervisionOfficerMetricEventFixture });
    const response = await client.supervisionOfficerMetricEvents(
      supervisionOfficerSupervisorsFixture[0].externalId,
      ADVERSE_METRIC_IDS.enum.incarceration_starts,
    );
    expect(response).toEqual(supervisionOfficerMetricEventFixture);
  });

  it("actionStrategies parses the data", async () => {
    mockAxios.onGet().replyOnce(200, rawActionStrategyFixture);
    const response = await client.actionStrategies("fake-pseudo-id");
    expect(response).toEqual(actionStrategyFixture);
  });

  it("vitalsForSupervisor parses the data", async () => {
    mockAxios.onGet().replyOnce(200, rawSupervisionVitalsMetricFixture);
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
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 87,
              "officerPseudonymizedId": "hashed-so1",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -1,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 57,
              "officerPseudonymizedId": "hashed-so2",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 1.2,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 31,
              "officerPseudonymizedId": "hashed-so3",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 3.4,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 22,
              "officerPseudonymizedId": "hashed-so4",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -3,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 50,
              "officerPseudonymizedId": "hashed-so5",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -0.2,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 22,
              "officerPseudonymizedId": "hashed-so8",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 5.9,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 79,
              "officerPseudonymizedId": "hashed-so9",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 1.5,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 89,
              "officerPseudonymizedId": "hashed-so10",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 3,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 71,
              "officerPseudonymizedId": "hashed-so6",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -1,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 93,
              "officerPseudonymizedId": "hashed-so7",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
          ],
        },
        {
          "metricId": "timely_risk_assessment",
          "vitalsMetrics": [
            {
              "metric30DDelta": -4,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 99,
              "officerPseudonymizedId": "hashed-so1",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -1.7,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 86,
              "officerPseudonymizedId": "hashed-so2",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 0.7,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 97,
              "officerPseudonymizedId": "hashed-so3",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 0.9,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 98,
              "officerPseudonymizedId": "hashed-so4",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -5.9,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 89,
              "officerPseudonymizedId": "hashed-so5",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 1,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 90,
              "officerPseudonymizedId": "hashed-so8",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 0,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 100,
              "officerPseudonymizedId": "hashed-so9",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -3.4,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 79,
              "officerPseudonymizedId": "hashed-so10",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": -5.4,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 77,
              "officerPseudonymizedId": "hashed-so6",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
            {
              "metric30DDelta": 5.4,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 84,
              "officerPseudonymizedId": "hashed-so7",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
          ],
        },
      ]
    `);
  });

  it("vitalsForOfficer parses the data", async () => {
    const { pseudonymizedId } = supervisionOfficerFixture[0];
    const filteredData = rawSupervisionVitalsMetricFixture.map(
      ({ vitalsMetrics, ...rest }) => ({
        ...rest,
        vitalsMetrics: vitalsMetrics.filter(
          ({ officerPseudonymizedId }) =>
            officerPseudonymizedId === pseudonymizedId,
        ),
      }),
    );

    mockAxios.onGet().replyOnce(200, filteredData);
    const response = await client.vitalsForOfficer(pseudonymizedId);
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "metricId": "timely_contact",
          "vitalsMetrics": [
            {
              "metric30DDelta": -7,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 87,
              "officerPseudonymizedId": "hashed-so1",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
          ],
        },
        {
          "metricId": "timely_risk_assessment",
          "vitalsMetrics": [
            {
              "metric30DDelta": -4,
              "metricDate": 2021-12-16T00:00:00.000Z,
              "metricValue": 99,
              "officerPseudonymizedId": "hashed-so1",
              "previousMetricDate": 2021-11-16T00:00:00.000Z,
            },
          ],
        },
      ]
    `);
  });

  it("submitRosterChangeRequestIntercomTicket parses the data", async () => {
    const [supervisorPseudoId, mockRequest] = Object.entries(
      rawRosterChangeRequestFixtures,
    )[0];
    mockAxios.onPost().replyOnce(200, rawRosterChangeRequestResponseFixture);
    const response = await client.submitRosterChangeRequestIntercomTicket(
      supervisorPseudoId,
      mockRequest,
    );
    expect(response).toEqual(rosterChangeRequestResponseFixture);
  });

  it("submitRosterChangeRequestIntercomTicket calls the correct endpoint", async () => {
    const supervisorPseudoId = Object.keys(rawRosterChangeRequestFixtures)[0];
    mockAxios.onPost().replyOnce(200, rawRosterChangeRequestResponseFixture);
    await client.submitRosterChangeRequestIntercomTicket(
      supervisorPseudoId,
      rosterChangeRequestFixtures[0],
    );
    expect(mockAxios.history.post[0].url).toEqual(
      encodeURI(
        `${BASE_URL}/supervisor/${supervisorPseudoId}/roster_change_request`,
      ),
    );
  });
});
