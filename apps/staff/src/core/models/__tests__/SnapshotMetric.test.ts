// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { waitFor } from "@testing-library/dom";
import { disableFetchMocks, enableFetchMocks } from "jest-fetch-mock";
import { runInAction } from "mobx";

import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import CoreStore from "../../CoreStore";
import { FILTER_TYPES } from "../../utils/constants";
import { isAbortException } from "../../utils/exceptions";
import SnapshotMetric from "../SnapshotMetric";

const OLD_ENV = process.env;

const mockTenantId = "US_TN";
const BASE_URL = `http://localhost:5000/pathways/${mockTenantId}/LibertyToPrisonTransitionsCount`;

describe("SnapshotMetric", () => {
  let metric: SnapshotMetric;

  beforeAll(() => {
    enableFetchMocks();
  });

  beforeEach(() => {
    const mockRootStore = {
      userStore: {} as UserStore,
      tenantStore: { currentTenantId: mockTenantId } as TenantStore,
    };
    const mockCoreStore: CoreStore = new CoreStore(mockRootStore);
    process.env = Object.assign(process.env, {
      REACT_APP_DEPLOY_ENV: "dev",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    fetchMock.mockResponse(
      JSON.stringify({
        data: [
          {
            judicialDistrict: "1",
            count: 150,
          },
          {
            judicialDistrict: "2",
            count: 100,
          },
        ],
        metadata: {
          lastUpdated: "2022-01-01",
        },
      })
    );
    mockCoreStore.setPage("libertyToPrison");
    mockCoreStore.setSection("countByLocation");
    mockCoreStore.filtersStore.resetFilters();
    metric = new SnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: mockCoreStore,
      accessor: "judicialDistrict",
      filters: {
        enabledFilters: [
          FILTER_TYPES.TIME_PERIOD,
          FILTER_TYPES.GENDER,
          FILTER_TYPES.JUDICIAL_DISTRICT,
          FILTER_TYPES.AGE_GROUP,
        ],
      },
    });
    metric.hydrate();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    fetchMock.resetMocks();
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    disableFetchMocks();
  });

  it("fetches metrics when initialized", () => {
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(
        `${BASE_URL}?filters[time_period]=months_0_6&group=judicial_district`
      )
    );
  });

  it("returns the correct total count", () => {
    expect(metric.totalCount).toBe(250);
  });

  it("sets isEmpty to false", () => {
    expect(metric.isEmpty).toEqual(false);
  });

  it("sets isEmpty to true when there is no data", () => {
    jest.mock("../../../api/metrics/metricsClient", () => {
      return {
        callNewMetricsApi: jest.fn().mockResolvedValue({}),
      };
    });

    const mockRootStore = {
      userStore: {} as UserStore,
      tenantStore: { currentTenantId: mockTenantId } as TenantStore,
    };
    metric = new SnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      rootStore: new CoreStore(mockRootStore),
      endpoint: "LibertyToPrisonTransitionsCount",
      accessor: "judicialDistrict",
    });
    metric.hydrate();

    expect(metric.isEmpty).toEqual(true);
  });

  it("calls the backend again when filters change", async () => {
    runInAction(() => {
      metric.rootStore?.filtersStore.setFilters({
        gender: ["MALE"],
        ageGroup: ["25-29", "30-34"],
      });
    });

    // Add `waitFor` to give time for all calls to actually be made before we check
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toEqual(
      encodeURI(
        `${BASE_URL}?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[age_group]=25-29&filters[age_group]=30-34` +
          `&group=judicial_district`
      )
    );
  });

  it("does not filter on the group by value", async () => {
    runInAction(() => {
      metric.rootStore?.filtersStore.setFilters({
        gender: ["MALE"],
        judicialDistrict: ["JUDICIAL_DISTRICT_1", "JUDICIAL_DISTRICT_2"],
      });
    });

    // Add `waitFor` to give time for all calls to actually be made before we check
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toEqual(
      encodeURI(
        `${BASE_URL}?filters[time_period]=months_0_6&filters[gender]=MALE&group=judicial_district`
      )
    );
  });

  it("calculates population proportions", () => {
    expect(metric.dataSeries).toEqual([
      {
        judicialDistrict: "1",
        count: 150,
        populationProportion: "60",
      },
      {
        judicialDistrict: "2",
        count: 100,
        populationProportion: "40",
      },
    ]);
  });

  it("aborts in-progress requests and keeps the value from the final request", async () => {
    fetchMock.resetMocks();
    fetchMock
      // Slow request
      .mockResponseOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  body: JSON.stringify({
                    data: [
                      {
                        judicialDistrict: "1",
                        count: 50,
                      },
                      {
                        judicialDistrict: "2",
                        count: 100,
                      },
                    ],
                    metadata: {
                      lastUpdated: "2022-01-01",
                    },
                  }),
                }),
              1000
            )
          )
      )
      // Fast request
      .mockResponseOnce(
        JSON.stringify({
          data: [
            {
              judicialDistrict: "1",
              count: 270,
            },
            {
              judicialDistrict: "2",
              count: 180,
            },
          ],
          metadata: {
            lastUpdated: "2022-01-01",
          },
        })
      );
    // Trigger the slow request
    runInAction(() => {
      metric.rootStore?.filtersStore.setFilters({
        gender: ["MALE"],
      });
    });

    // Trigger the fast request
    runInAction(() => {
      metric.rootStore?.filtersStore.setFilters({
        gender: ["FEMALE"],
      });
    });

    // Add `waitFor` to give time for all calls to actually be made before we check
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(
        `${BASE_URL}?filters[time_period]=months_0_6&filters[gender]=MALE&group=judicial_district`
      )
    );
    expect(fetchMock.mock.calls[1][0]).toEqual(
      encodeURI(
        `${BASE_URL}?filters[time_period]=months_0_6&filters[gender]=FEMALE&group=judicial_district`
      )
    );
    expect(isAbortException(fetchMock.mock.results[0].value)).toBe(true);
    expect(metric.dataSeries).toEqual([
      {
        judicialDistrict: "1",
        count: 270,
        populationProportion: "60",
      },
      {
        judicialDistrict: "2",
        count: 180,
        populationProportion: "40",
      },
    ]);
  });

  it("has the correct downloadableData", () => {
    const expected = {
      chartDatasets: [
        {
          data: [
            {
              Count: 150,
            },
            {
              Count: 100,
            },
          ],
          label: "",
        },
      ],
      chartId: "Admissions from liberty to prison by judicial district",
      chartLabels: ["1", "2"],
      dataExportLabel: "Judicial District",
    };
    expect(metric.downloadableData).toEqual(expected);
  });
});
