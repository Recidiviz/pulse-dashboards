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

import { runInAction } from "mobx";

import { callNewMetricsApi } from "../../../api/metrics/metricsClient";
import RootStore from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import CoreStore from "../../CoreStore";
import { FILTER_TYPES } from "../../utils/constants";
import OverTimeMetric from "../OverTimeMetric";

const OLD_ENV = process.env;

const mockTenantId = "US_TN";

const mockRootStore = {
  userStore: {} as UserStore,
  tenantStore: { currentTenantId: mockTenantId } as TenantStore,
};

jest.mock("../../../api/metrics/metricsClient", () => {
  return {
    callNewMetricsApi: jest.fn().mockResolvedValue({
      data: [
        {
          year: 2022,
          month: 1,
          count: 1000,
          avg90day: 1000,
        },
        // The new backend does not necessarily return all months in the time period if it's missing
        // data at one end or the other, but the data returned will have all months in range, in
        // order.
        {
          year: 2022,
          month: 2,
          count: 0,
          avg90day: 1000,
        },
        {
          year: 2022,
          month: 3,
          count: 3000,
          avg90day: 1500,
        },
        {
          year: 2022,
          month: 4,
          count: 4000,
          avg90day: 2500,
        },
      ],
      metadata: {
        lastUpdated: "2022-05-01",
      },
    }),
  };
});

describe("OverTimeMetric", () => {
  let metric: OverTimeMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_DEPLOY_ENV: "dev",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    const mockCoreStore: CoreStore = new CoreStore(mockRootStore);
    mockCoreStore.setPage("libertyToPrison");
    mockCoreStore.setSection("countOverTime");
    mockCoreStore.filtersStore.resetFilters();
    metric = new OverTimeMetric({
      id: "libertyToPrisonPopulationOverTime",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: mockCoreStore,
      filters: {
        enabledFilters: [
          FILTER_TYPES.TIME_PERIOD,
          FILTER_TYPES.GENDER,
          FILTER_TYPES.JUDICIAL_DISTRICT,
        ],
      },
    });

    metric.hydrate();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("fetches metrics when initialized", () => {
    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `pathways/${mockTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("sets hydration state", () => {
    expect(metric.hydrationState.status).toBe("hydrated");
  });

  it("finds most recent month", () => {
    expect(OverTimeMetric.mostRecentDate(metric.dataSeries)).toEqual(
      new Date(2022, 3),
    );
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

    metric = new OverTimeMetric({
      id: "prisonPopulationOverTime",
      rootStore: new CoreStore(mockRootStore),
      endpoint: "PrisonPopulationOverTime",
    });
    metric.hydrate();

    expect(metric.isEmpty).toEqual(true);
  });

  it("does not throw when accessing the most recent date without loaded data", () => {
    jest.mock("../../../api/metrics/metricsClient", () => {
      return {
        callNewMetricsApi: jest.fn().mockResolvedValue({}),
      };
    });

    metric = new OverTimeMetric({
      id: "prisonPopulationOverTime",
      rootStore: new CoreStore(mockRootStore),
      endpoint: "PrisonPopulationOverTime",
    });
    metric.hydrate();

    expect(OverTimeMetric.mostRecentDate(metric.dataSeries)).toEqual(
      new Date(9999, 11, 31),
    );
  });

  it("calls the backend again when filters change", () => {
    runInAction(() => {
      metric.rootStore.filtersStore.setFilters({
        gender: ["MALE"],
        judicialDistrict: ["JUDICIAL_DISTRICT_1", "JUDICIAL_DISTRICT_2"],
      });
    });

    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `pathways/${mockTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[judicial_district]=JUDICIAL_DISTRICT_1&filters[judicial_district]=JUDICIAL_DISTRICT_2`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("calls the backend again when the tenant changes", () => {
    const newTenantId = "US_CO";
    runInAction(() => {
      metric.rootStore.tenantStore.currentTenantId = newTenantId;
    });

    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `pathways/${newTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("does not call the backend again when the page changes", () => {
    expect(metric.isCurrentlyViewedMetric).toEqual(true);

    runInAction(() => {
      metric.rootStore.setPage("prison");
      metric.rootStore.filtersStore.setFilters({
        gender: ["MALE"],
        judicialDistrict: ["JUDICIAL_DISTRICT_1", "JUDICIAL_DISTRICT_2"],
      });
    });

    expect(metric.isCurrentlyViewedMetric).toEqual(false);

    // The API will get called before we change the page, so we specifically test here that it
    // doesn't get called with the new filter values
    expect(callNewMetricsApi).not.toHaveBeenCalledWith(
      encodeURI(
        `pathways/${mockTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[judicial_district]=JUDICIAL_DISTRICT_1&filters[judicial_district]=JUDICIAL_DISTRICT_2`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("does not call the backend again when the section changes", () => {
    expect(metric.isCurrentlyViewedMetric).toEqual(true);

    runInAction(() => {
      metric.rootStore.setSection("personLevelDetail");
      metric.rootStore.filtersStore.setFilters({
        gender: ["MALE"],
        judicialDistrict: ["JUDICIAL_DISTRICT_1", "JUDICIAL_DISTRICT_2"],
      });
    });

    expect(metric.isCurrentlyViewedMetric).toEqual(false);

    // The API will get called before we change the page, so we specifically test here that it
    // doesn't get called with the new filter values
    expect(callNewMetricsApi).not.toHaveBeenCalledWith(
      encodeURI(
        `pathways/${mockTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[judicial_district]=JUDICIAL_DISTRICT_1&filters[judicial_district]=JUDICIAL_DISTRICT_2`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("calls the backend with current filter values when the section changes back", () => {
    expect(metric.isCurrentlyViewedMetric).toEqual(true);
    runInAction(() => {
      metric.rootStore.setSection("personLevelDetail");
      metric.rootStore.filtersStore.setFilters({
        gender: ["MALE"],
        judicialDistrict: ["JUDICIAL_DISTRICT_1", "JUDICIAL_DISTRICT_2"],
      });
      metric.rootStore.setSection("countOverTime");
    });

    expect(metric.isCurrentlyViewedMetric).toEqual(true);

    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `pathways/${mockTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[judicial_district]=JUDICIAL_DISTRICT_1&filters[judicial_district]=JUDICIAL_DISTRICT_2`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("fills in missing months", () => {
    expect(metric.dataSeries).toEqual([
      {
        year: 2021,
        month: 10,
        count: 0,
        avg90day: 0,
      },
      {
        year: 2021,
        month: 11,
        count: 0,
        avg90day: 0,
      },
      {
        year: 2021,
        month: 12,
        count: 0,
        avg90day: 0,
      },
      {
        year: 2022,
        month: 1,
        count: 1000,
        avg90day: 1000,
      },
      {
        year: 2022,
        month: 2,
        count: 0,
        avg90day: 1000,
      },
      {
        year: 2022,
        month: 3,
        count: 3000,
        avg90day: 1500,
      },
      {
        year: 2022,
        month: 4,
        count: 4000,
        avg90day: 2500,
      },
    ]);
  });

  it("has the correct downloadableData", () => {
    const expected = {
      chartDatasets: [
        {
          data: [
            {
              Population: 0,
              "3-month rolling average": 0,
            },
            {
              Population: 0,
              "3-month rolling average": 0,
            },
            {
              Population: 0,
              "3-month rolling average": 0,
            },
            {
              Population: 1000,
              "3-month rolling average": 1000,
            },
            {
              Population: 0,
              "3-month rolling average": 1000,
            },
            {
              Population: 3000,
              "3-month rolling average": 1500,
            },
            {
              Population: 4000,
              "3-month rolling average": 2500,
            },
          ],
          label: "",
        },
      ],
      chartId: "Admissions from liberty to prison over time",
      chartLabels: [
        "Oct '21",
        "Nov '21",
        "Dec '21",
        "Jan '22",
        "Feb '22",
        "Mar '22",
        "Apr '22",
      ],
      dataExportLabel: "Month",
    };
    expect(metric.downloadableData).toEqual(expected);
  });
});
