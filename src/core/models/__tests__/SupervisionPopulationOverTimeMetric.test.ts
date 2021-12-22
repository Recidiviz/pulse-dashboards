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

import { callMetricsApi } from "../../../api/metrics/metricsClient";
import RootStore from "../../../RootStore";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import { FILTER_TYPES } from "../../utils/constants";
import SupervisionPopulationOverTimeMetric from "../SupervisionPopulationOverTimeMetric";
import { createSupervisionPopulationTimeSeries } from "../utils";

const OLD_ENV = process.env;

const mockTenantId = "US_TN";
const mockCoreStore = { currentTenantId: mockTenantId } as CoreStore;
const filtersStore = new FiltersStore({ rootStore: mockCoreStore });
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
          age_group: undefined,
          state_code: "US_TN",
          person_count: 7641,
          avg_90day: 7000,
          year: "2015",
          most_severe_violation: "ALL",
          number_of_violations: "ALL",
          supervision_type: "ALL",
        },
        {
          gender: "ALL",
          month: "1",
          district: "ALL",
          age_group: undefined,
          state_code: "US_TN",
          person_count: 7641,
          avg_90day: 7000,
          year: "2016",
          most_severe_violation: undefined,
          number_of_violations: undefined,
          supervision_type: undefined,
        },
        {
          gender: "MALE",
          month: "5",
          district: "DISTRICT_1",
          age_group: undefined,
          state_code: "US_TN",
          person_count: 7641,
          avg_90day: 7000,
          year: "2016",
        },
      ],
    }),
  };
});

describe("SupervisionPopulationOverTimeMetric", () => {
  let metric: SupervisionPopulationOverTimeMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
    });
    mockCoreStore.filtersStore = filtersStore;
    metric = new SupervisionPopulationOverTimeMetric({
      id: "prisonPopulationOverTime",
      tenantId: mockTenantId,
      sourceFilename: "supervision_to_liberty_count_by_month",
      rootStore: mockCoreStore,
      dataTransformer: (data) => createSupervisionPopulationTimeSeries(data),
      filters: {
        enabledFilters: [
          FILTER_TYPES.GENDER,
          FILTER_TYPES.LEGAL_STATUS,
          FILTER_TYPES.AGE_GROUP,
          FILTER_TYPES.DISTRICT,
        ],
      },
    });

    metric.hydrate();
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
    expect(metric.records).toEqual([
      {
        gender: "ALL",
        month: 12,
        district: "ALL",
        ageGroup: "ALL",
        count: 7641,
        avg90day: 7000,
        year: 2015,
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
      },
      {
        gender: "ALL",
        month: 1,
        district: "ALL",
        ageGroup: "ALL",
        count: 7641,
        avg90day: 7000,
        year: 2016,
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
      },
      {
        gender: "MALE",
        month: 5,
        district: "DISTRICT_1",
        ageGroup: "ALL",
        count: 7641,
        avg90day: 7000,
        year: 2016,
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
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
      dataTransformer: (data) => createSupervisionPopulationTimeSeries(data),
      filters: {
        enabledFilters: [
          FILTER_TYPES.GENDER,
          FILTER_TYPES.LEGAL_STATUS,
          FILTER_TYPES.AGE_GROUP,
          FILTER_TYPES.DISTRICT,
        ],
      },
    });
    metric.hydrate();

    expect(metric.mostRecentDate).toEqual(new Date(9999, 11, 31));
  });

  describe("dataSeries", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore = filtersStore;

      metric = new SupervisionPopulationOverTimeMetric({
        id: "prisonPopulationOverTime",
        tenantId: mockTenantId,
        sourceFilename: "supervision_to_liberty_count_by_month",
        rootStore: mockCoreStore,
        dataTransformer: (data) => createSupervisionPopulationTimeSeries(data),
        filters: {
          enabledFilters: [
            FILTER_TYPES.GENDER,
            FILTER_TYPES.LEGAL_STATUS,
            FILTER_TYPES.AGE_GROUP,
            FILTER_TYPES.DISTRICT,
          ],
        },
      });
      metric.hydrate();
    });

    it("filters by default values", () => {
      expect(metric.dataSeries).toEqual([
        {
          year: 2015,
          month: 12,
          district: "ALL",
          gender: "ALL",
          count: 7641,
          avg90day: 7000,
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          race: "ALL",
          supervisionLevel: "ALL",
        },
        {
          year: 2016,
          month: 1,
          district: "ALL",
          gender: "ALL",
          count: 7641,
          avg90day: 7000,
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          race: "ALL",
          supervisionLevel: "ALL",
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
            count: 7641,
            district: "DISTRICT_1",
            avg90day: 7000,
            year: 2016,
            mostSevereViolation: "ALL",
            numberOfViolations: "ALL",
            supervisionType: "ALL",
            race: "ALL",
            supervisionLevel: "ALL",
          },
        ]);
      });
    });
  });
});
