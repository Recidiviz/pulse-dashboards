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
import LibertyPopulationSnapshotMetric from "../LibertyPopulationSnapshotMetric";
import SnapshotMetric from "../SnapshotMetric";
import { createLibertyPopulationSnapshot, formatDateString } from "../utils";

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
      liberty_to_prison_population_snapshot_by_dimension: [
        // ALL row 6 months
        {
          gender: "ALL",
          age_group: "ALL",
          judicial_district: "ALL",
          event_count: "45",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        // ALL row 12 months
        {
          gender: "ALL",
          age_group: "ALL",
          judicial_district: "ALL",
          event_count: "20",
          last_updated: "2021-10-27",
          time_period: "months_7_12",
        },
        // Row with missing dimension value which will default to Unknown
        {
          gender: undefined,
          judicial_district: "ALL",
          event_count: "1",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        {
          gender: "ALL",
          judicial_district: "1",
          event_count: "15",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        {
          gender: "ALL",
          judicial_district: "2",
          event_count: "10",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        {
          gender: "FEMALE",
          judicial_district: "1",
          event_count: "5",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
      ],
    }),
    callNewMetricsApi: jest.fn().mockResolvedValue({
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
    }),
  };
});

describe("LibertyPopulationSnapshotMetric", () => {
  let metric: LibertyPopulationSnapshotMetric;
  let newBackendMetric: SnapshotMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    mockCoreStore.filtersStore.resetFilters();
    metric = new LibertyPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      tenantId: mockTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: mockCoreStore,
      accessor: "judicialDistrict",
      dataTransformer: createLibertyPopulationSnapshot,
      filters: {
        enabledFilters: [
          FILTER_TYPES.TIME_PERIOD,
          FILTER_TYPES.GENDER,
          FILTER_TYPES.JUDICIAL_DISTRICT,
        ],
      },
      hasTimePeriodDimension: true,
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
      `${mockTenantId.toLowerCase()}/pathways/liberty_to_prison_population_snapshot_by_dimension`,
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
        ageGroup: "ALL",
        judicialDistrict: "ALL",
        count: 45,
        lastUpdated: formatDateString("2021-10-27"),
        race: "ALL",
        timePeriod: "6",
        priorLengthOfIncarceration: "ALL",
      },
      {
        gender: "ALL",
        ageGroup: "ALL",
        judicialDistrict: "ALL",
        count: 20,
        lastUpdated: formatDateString("2021-10-27"),
        race: "ALL",
        timePeriod: "12",
        priorLengthOfIncarceration: "ALL",
      },
      {
        gender: "Unknown",
        ageGroup: "ALL",
        judicialDistrict: "ALL",
        count: 1,
        lastUpdated: formatDateString("2021-10-27"),
        race: "ALL",
        timePeriod: "6",
        priorLengthOfIncarceration: "ALL",
      },
      {
        gender: "ALL",
        ageGroup: "ALL",
        judicialDistrict: "1",
        count: 15,
        lastUpdated: formatDateString("2021-10-27"),
        race: "ALL",
        timePeriod: "6",
        priorLengthOfIncarceration: "ALL",
      },
      {
        gender: "ALL",
        ageGroup: "ALL",
        judicialDistrict: "2",
        count: 10,
        lastUpdated: formatDateString("2021-10-27"),
        race: "ALL",
        timePeriod: "6",
        priorLengthOfIncarceration: "ALL",
      },
      {
        gender: "FEMALE",
        ageGroup: "ALL",
        judicialDistrict: "1",
        count: 5,
        lastUpdated: formatDateString("2021-10-27"),
        race: "ALL",
        timePeriod: "6",
        priorLengthOfIncarceration: "ALL",
      },
    ]);
  });

  describe("totalCount", () => {
    beforeEach(() => {
      metric = new LibertyPopulationSnapshotMetric({
        id: "libertyToPrisonPopulationByDistrict",
        tenantId: mockTenantId,
        sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
        rootStore: mockCoreStore,
        accessor: "judicialDistrict",
        dataTransformer: createLibertyPopulationSnapshot,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.JUDICIAL_DISTRICT,
          ],
        },
        hasTimePeriodDimension: true,
      });
      metric.hydrate();
    });

    it("returns the count from the ALL row", () => {
      expect(metric.totalCount).toBe(45);
    });

    it("returns the sum from both ALL rows when time period is 12", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            timePeriod: ["12"],
          });
        }
      });

      expect(metric.totalCount).toBe(65);
    });
  });

  describe("dataSeries", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore.setFilters({
        timePeriod: ["6"],
      });

      newBackendMetric = new SnapshotMetric({
        id: "libertyToPrisonPopulationByDistrict",
        rootStore: mockCoreStore,
        endpoint: "LibertyToPrisonTransitionsCount",
        accessor: "judicialDistrict",
        filters: {
          enabledFilters: [FILTER_TYPES.TIME_PERIOD, FILTER_TYPES.GENDER],
        },
      });
      metric = new LibertyPopulationSnapshotMetric({
        id: "libertyToPrisonPopulationByDistrict",
        tenantId: mockTenantId,
        sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
        rootStore: mockCoreStore,
        accessor: "judicialDistrict",
        dataTransformer: createLibertyPopulationSnapshot,
        filters: {
          enabledFilters: [FILTER_TYPES.TIME_PERIOD, FILTER_TYPES.GENDER],
        },
        hasTimePeriodDimension: true,
        newBackendMetric,
      });
      metric.hydrate();
    });

    it("calls the new API and logs diffs", () => {
      expect(callNewMetricsApi).toHaveBeenCalledWith(
        encodeURI(
          `${mockTenantId}/LibertyToPrisonTransitionsCount?filters[time_period]=months_0_6&group=judicial_district`
        ),
        RootStore.getTokenSilently
      );
      expect(metric.diffs?.totalDiffs && metric.diffs?.totalDiffs > 0);
    });

    it("filters by default values", () => {
      // totalCount (denominator of populationProportion) is 45
      expect(metric.dataSeries).toEqual([
        {
          gender: "ALL",
          ageGroup: "ALL",
          judicialDistrict: "1",
          count: 15,
          lastUpdated: formatDateString("2021-10-27"),
          populationProportion: "33",
          race: "ALL",
          timePeriod: "6",
          priorLengthOfIncarceration: "ALL",
        },
        {
          gender: "ALL",
          ageGroup: "ALL",
          judicialDistrict: "2",
          count: 10,
          lastUpdated: formatDateString("2021-10-27"),
          populationProportion: "22",
          race: "ALL",
          timePeriod: "6",
          priorLengthOfIncarceration: "ALL",
        },
      ]);
    });

    it("does not filter by timePeriod if hasTimePeriodDimension is false", () => {
      metric.hasTimePeriodDimension = false;

      // totalCount (denominator of populationProportion) is 90
      expect(metric.dataSeries).toEqual([
        {
          gender: "ALL",
          ageGroup: "ALL",
          judicialDistrict: "1",
          count: 15,
          lastUpdated: formatDateString("2021-10-27"),
          populationProportion: "23",
          race: "ALL",
          timePeriod: "6",
          priorLengthOfIncarceration: "ALL",
        },
        {
          gender: "ALL",
          ageGroup: "ALL",
          judicialDistrict: "2",
          count: 10,
          lastUpdated: formatDateString("2021-10-27"),
          populationProportion: "15",
          race: "ALL",
          timePeriod: "6",
          priorLengthOfIncarceration: "ALL",
        },
      ]);
    });

    it("has the correct downloadableData", () => {
      const expected = {
        chartDatasets: [
          {
            data: [
              {
                Count: 15,
              },
              {
                Count: 10,
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

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            gender: ["FEMALE"],
            judicialDistrict: ["1"],
            timePeriod: ["12"],
          });
        }

        // totalCount (denominator of populationProportion) is 65
        expect(metric.dataSeries).toEqual([
          {
            ageGroup: "ALL",
            gender: "FEMALE",
            judicialDistrict: "1",
            count: 5,
            lastUpdated: formatDateString("2021-10-27"),
            populationProportion: "8",
            race: "ALL",
            timePeriod: "6",
            priorLengthOfIncarceration: "ALL",
          },
        ]);
      });
    });
  });
});
