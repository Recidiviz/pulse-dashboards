// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import {
  callMetricsApi,
  callNewMetricsApi,
} from "../../../api/metrics/metricsClient";
import RootStore from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import CoreStore from "../../CoreStore";
import { FILTER_TYPES } from "../../utils/constants";
import OverTimeMetric from "../OverTimeMetric";
import SupervisionPopulationOverTimeMetric from "../SupervisionPopulationOverTimeMetric";
import { createSupervisionPopulationTimeSeries } from "../utils";

const OLD_ENV = process.env;

const mockTenantId = "US_TN";
const mockRootStore = {
  userStore: {} as UserStore,
  tenantStore: { currentTenantId: mockTenantId } as TenantStore,
};
const mockCoreStore: CoreStore = new CoreStore(mockRootStore);
jest.mock("../../../RootStore", () => ({
  getTokenSilently: jest.fn().mockReturnValue("auth token"),
}));
global.fetch = jest.fn().mockResolvedValue({
  blob: () => "blob",
});

jest.mock("../../../api/metrics/metricsClient", () => {
  return {
    callMetricsApi: jest.fn().mockResolvedValue({
      // time series data is sorted by date ascending in the data platform
      supervision_to_liberty_count_by_month: [
        {
          gender: "ALL",
          month: "12",
          district: "ALL",
          supervision_type: "ALL",
          state_code: "US_TN",
          event_count: 7641,
          year: "2015",
        },
        {
          gender: "ALL",
          month: "1",
          district: "ALL",
          supervision_type: undefined,
          state_code: "US_TN",
          event_count: 7644,
          year: "2016",
        },
        {
          gender: "MALE",
          month: "5",
          district: "DISTRICT_1",
          supervision_type: "ALL",
          state_code: "US_TN",
          person_count: 7647,
          year: "2016",
        },
      ],
    }),
    callNewMetricsApi: jest.fn().mockResolvedValue({
      data: [
        {
          year: 2015,
          month: 12,
          count: 7000,
        },
      ],
      metadata: {
        lastUpdated: "2022-01-01",
      },
    }),
  };
});

describe("SupervisionPopulationOverTimeMetric", () => {
  let metric: SupervisionPopulationOverTimeMetric;
  let newBackendMetric: OverTimeMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    mockCoreStore.filtersStore.resetFilters();
    metric = new SupervisionPopulationOverTimeMetric({
      id: "prisonPopulationOverTime",
      tenantId: mockTenantId,
      sourceFilename: "supervision_to_liberty_count_by_month",
      rootStore: mockCoreStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: {
        enabledFilters: [
          FILTER_TYPES.GENDER,
          FILTER_TYPES.SUPERVISION_TYPE,
          FILTER_TYPES.DISTRICT,
        ],
      },
    });

    metric.hydrate();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    process.env = OLD_ENV;
  });

  it("fetches metrics when initialized", () => {
    expect(callMetricsApi).toHaveBeenCalledWith(
      `${mockTenantId.toLowerCase()}/pathways/supervision_to_liberty_count_by_month`,
      RootStore.getTokenSilently
    );
  });

  it("sets isLoading to false", () => {
    expect(metric.isLoading).toEqual(false);
  });

  it("has a transformed records property", () => {
    // supervisionType values default to "Unknown" since that filter is enabled
    // legalStatus values default to "ALL" since that filter is not enabled
    expect(metric.records).toEqual([
      {
        gender: "ALL",
        month: 12,
        district: "ALL",
        ageGroup: "ALL",
        count: 7641,
        year: 2015,
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
      },
      {
        gender: "ALL",
        month: 1,
        district: "ALL",
        ageGroup: "ALL",
        count: 7644,
        year: 2016,
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "Unknown",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
      },
      {
        gender: "MALE",
        month: 5,
        district: "DISTRICT_1",
        ageGroup: "ALL",
        count: 7647,
        year: 2016,
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
      },
    ]);
  });

  it("finds most recent month", () => {
    expect(metric.mostRecentDate).toEqual(new Date(2016, 4));
  });

  it("does not throw when accessing the most recent date without loaded data", () => {
    jest.mock("../../../api/metrics/metricsClient", () => {
      return {
        callMetricsApi: jest.fn().mockResolvedValue({
          supervision_to_liberty_count_by_month: [],
        }),
      };
    });

    metric = new SupervisionPopulationOverTimeMetric({
      id: "prisonPopulationOverTime",
      tenantId: mockTenantId,
      sourceFilename: "supervision_to_liberty_count_by_month",
      rootStore: mockCoreStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: {
        enabledFilters: [
          FILTER_TYPES.GENDER,
          FILTER_TYPES.SUPERVISION_TYPE,
          FILTER_TYPES.DISTRICT,
        ],
      },
    });
    metric.hydrate();

    expect(metric.mostRecentDate).toEqual(new Date(9999, 11, 31));
  });

  describe("dataSeries", () => {
    beforeEach(() => {
      newBackendMetric = new OverTimeMetric({
        id: "prisonPopulationOverTime",
        endpoint: "SupervisionToLibertyTransitionsCount",
        rootStore: mockCoreStore,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.SUPERVISION_TYPE,
            FILTER_TYPES.DISTRICT,
          ],
        },
      });
      metric = new SupervisionPopulationOverTimeMetric({
        id: "prisonPopulationOverTime",
        tenantId: mockTenantId,
        sourceFilename: "supervision_to_liberty_count_by_month",
        rootStore: mockCoreStore,
        dataTransformer: createSupervisionPopulationTimeSeries,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.SUPERVISION_TYPE,
            FILTER_TYPES.DISTRICT,
          ],
        },
        newBackendMetric,
      });
      metric.hydrate();
    });

    it("calls the new API and logs diffs", () => {
      expect(callNewMetricsApi).toHaveBeenCalledWith(
        encodeURI(
          `${mockTenantId}/SupervisionToLibertyTransitionsCount?filters[time_period]=months_0_6`
        ),
        RootStore.getTokenSilently
      );
      expect(metric.diffs?.totalDiffs && metric.diffs?.totalDiffs > 0);
    });

    it("calls the new API and does not log diffs if there are none", () => {
      jest.mock("../../../api/metrics/metricsClient", () => {
        return {
          callNewMetricsApi: jest.fn().mockResolvedValue({
            data: [
              {
                year: 2015,
                month: 12,
                count: 7641,
              },
              {
                year: 2016,
                month: 1,
                count: 7644,
              },
              {
                year: 2016,
                month: 5,
                count: 7647,
              },
            ],
            metadata: {
              lastUpdated: "2022-01-01",
            },
          }),
        };
      });

      expect(callNewMetricsApi).toHaveBeenCalledWith(
        encodeURI(
          `${mockTenantId}/SupervisionToLibertyTransitionsCount?filters[time_period]=months_0_6`
        ),
        RootStore.getTokenSilently
      );
      expect(metric.diffs?.totalDiffs === 0);
    });

    it("calls the new API with filters", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            gender: ["MALE"],
            district: ["DISTRICT_1", "DISTRICT_2"],
          });
        }
      });

      expect(callNewMetricsApi).toHaveBeenCalledWith(
        encodeURI(
          `${mockTenantId}/SupervisionToLibertyTransitionsCount?filters[time_period]=months_0_6` +
            `&filters[gender]=MALE&filters[district]=DISTRICT_1&filters[district]=DISTRICT_2`
        ),
        RootStore.getTokenSilently
      );
    });

    it("filters by default values", () => {
      expect(metric.dataSeries).toEqual([
        {
          year: 2015,
          month: 12,
          district: "ALL",
          gender: "ALL",
          count: 7641,
          avg90day: 7641,
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          race: "ALL",
          supervisionLevel: "ALL",
          ageGroup: "ALL",
          lengthOfStay: "ALL",
          officerName: "ALL",
        },
      ]);
    });

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            gender: ["MALE"],
            district: ["DISTRICT_1"],
          });
        }

        expect(metric.dataSeries).toEqual([
          {
            gender: "MALE",
            month: 5,
            count: 7647,
            district: "DISTRICT_1",
            avg90day: 7647,
            year: 2016,
            mostSevereViolation: "ALL",
            numberOfViolations: "ALL",
            supervisionType: "ALL",
            race: "ALL",
            supervisionLevel: "ALL",
            ageGroup: "ALL",
            lengthOfStay: "ALL",
            officerName: "ALL",
          },
        ]);
      });
    });
  });
});
