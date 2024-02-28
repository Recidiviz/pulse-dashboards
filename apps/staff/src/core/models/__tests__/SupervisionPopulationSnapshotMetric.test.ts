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
import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import CoreStore from "../../CoreStore";
import { FILTER_TYPES } from "../../utils/constants";
import SupervisionPopulationSnapshotMetric from "../SupervisionPopulationSnapshotMetric";
import {
  createSupervisionPopulationSnapshot,
  formatDateString,
} from "../utils";

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

jest.mock("../../../api/metrics/metricsClient", () => {
  return {
    callMetricsApi: jest.fn().mockResolvedValue({
      supervision_to_prison_population_snapshot_by_dimension: [
        // ALL row 6 months
        {
          gender: "ALL",
          age_group: "ALL",
          district: "ALL",
          event_count: "45",
          last_updated: "2021-10-27",
          most_severe_violation: "ALL",
          number_of_violations: "ALL",
          supervision_type: "ALL",
          length_of_stay: "ALL",
          time_period: "months_0_6",
        },
        // ALL row 12 months
        {
          gender: "ALL",
          age_group: "ALL",
          district: "ALL",
          event_count: "20",
          last_updated: "2021-10-27",
          most_severe_violation: "ALL",
          number_of_violations: "ALL",
          supervision_type: "ALL",
          length_of_stay: "ALL",
          time_period: "months_7_12",
        },
        // Row with missing dimension value which will default to Unknown
        {
          gender: undefined,
          district: "ALL",
          event_count: "1",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        {
          gender: "ALL",
          district: "DISTRICT 10",
          event_count: "15",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        {
          gender: "ALL",
          district: "DISTRICT 81",
          person_count: "10",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
        {
          gender: "FEMALE",
          district: "DISTRICT 10",
          person_count: "5",
          last_updated: "2021-10-27",
          time_period: "months_0_6",
        },
      ],
    }),
  };
});

describe("SupervisionPopulationSnapshotMetric", () => {
  let metric: SupervisionPopulationSnapshotMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
    });
    metric = new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByDistrict",
      tenantId: mockTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      rootStore: mockCoreStore,
      accessor: "district",
      dataTransformer: createSupervisionPopulationSnapshot,
      filters: {
        enabledFilters: [
          FILTER_TYPES.TIME_PERIOD,
          FILTER_TYPES.GENDER,
          FILTER_TYPES.DISTRICT,
        ],
      },
      hasTimePeriodDimension: true,
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
      `${mockTenantId.toLowerCase()}/pathways/supervision_to_prison_population_snapshot_by_dimension`,
      RootStore.getTokenSilently,
    );
  });

  it("sets hydration state", () => {
    expect(metric.hydrationState.status).toBe("hydrated");
  });

  it("has a transformed records property", () => {
    expect(metric.records).toEqual([
      {
        gender: "ALL",
        ageGroup: "ALL",
        district: "ALL",
        count: 45,
        lastUpdated: formatDateString("2021-10-27"),
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
        timePeriod: "6",
      },
      {
        gender: "ALL",
        ageGroup: "ALL",
        district: "ALL",
        count: 20,
        lastUpdated: formatDateString("2021-10-27"),
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
        timePeriod: "12",
      },
      {
        gender: "Unknown",
        ageGroup: "ALL",
        district: "ALL",
        count: 1,
        lastUpdated: formatDateString("2021-10-27"),
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
        timePeriod: "6",
      },
      {
        gender: "ALL",
        ageGroup: "ALL",
        district: "DISTRICT 10",
        count: 15,
        lastUpdated: formatDateString("2021-10-27"),
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
        timePeriod: "6",
      },
      {
        gender: "ALL",
        ageGroup: "ALL",
        district: "DISTRICT 81",
        count: 10,
        lastUpdated: formatDateString("2021-10-27"),
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
        timePeriod: "6",
      },
      {
        gender: "FEMALE",
        ageGroup: "ALL",
        district: "DISTRICT 10",
        count: 5,
        lastUpdated: formatDateString("2021-10-27"),
        mostSevereViolation: "ALL",
        numberOfViolations: "ALL",
        supervisionType: "ALL",
        lengthOfStay: "ALL",
        officerName: "ALL",
        race: "ALL",
        supervisionLevel: "ALL",
        timePeriod: "6",
      },
    ]);
  });

  describe("totalCount", () => {
    beforeEach(() => {
      metric = new SupervisionPopulationSnapshotMetric({
        id: "supervisionToPrisonPopulationByDistrict",
        tenantId: mockTenantId,
        sourceFilename:
          "supervision_to_prison_population_snapshot_by_dimension",
        rootStore: mockCoreStore,
        accessor: "district",
        dataTransformer: createSupervisionPopulationSnapshot,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.DISTRICT,
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
      metric = new SupervisionPopulationSnapshotMetric({
        id: "supervisionToPrisonPopulationByDistrict",
        tenantId: mockTenantId,
        sourceFilename:
          "supervision_to_prison_population_snapshot_by_dimension",
        rootStore: mockCoreStore,
        accessor: "district",
        dataTransformer: createSupervisionPopulationSnapshot,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.DISTRICT,
          ],
        },
        hasTimePeriodDimension: true,
      });
      metric.hydrate();
    });

    it("filters by default values", () => {
      // totalCount (denominator of populationProportion) is 45
      expect(metric.dataSeries).toEqual([
        {
          gender: "ALL",
          ageGroup: "ALL",
          district: "DISTRICT 10",
          count: 15,
          lastUpdated: formatDateString("2021-10-27"),
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          lengthOfStay: "ALL",
          officerName: "ALL",
          populationProportion: "33",
          race: "ALL",
          supervisionLevel: "ALL",
          timePeriod: "6",
        },
        {
          gender: "ALL",
          ageGroup: "ALL",
          district: "DISTRICT 81",
          count: 10,
          lastUpdated: formatDateString("2021-10-27"),
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          lengthOfStay: "ALL",
          officerName: "ALL",
          populationProportion: "22",
          race: "ALL",
          supervisionLevel: "ALL",
          timePeriod: "6",
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
          district: "DISTRICT 10",
          count: 15,
          lastUpdated: formatDateString("2021-10-27"),
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          lengthOfStay: "ALL",
          officerName: "ALL",
          populationProportion: "23",
          race: "ALL",
          supervisionLevel: "ALL",
          timePeriod: "6",
        },
        {
          gender: "ALL",
          ageGroup: "ALL",
          district: "DISTRICT 81",
          count: 10,
          lastUpdated: formatDateString("2021-10-27"),
          mostSevereViolation: "ALL",
          numberOfViolations: "ALL",
          supervisionType: "ALL",
          lengthOfStay: "ALL",
          officerName: "ALL",
          populationProportion: "15",
          race: "ALL",
          supervisionLevel: "ALL",
          timePeriod: "6",
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
        chartId: "Admissions from supervision by district",
        chartLabels: ["District 10", "District 81"],
        dataExportLabel: "District",
      };
      expect(metric.downloadableData).toEqual(expected);
    });

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            gender: ["FEMALE"],
            district: ["DISTRICT 10"],
            timePeriod: ["12"],
          });
        }

        // totalCount (denominator of populationProportion) is 65
        expect(metric.dataSeries).toEqual([
          {
            ageGroup: "ALL",
            gender: "FEMALE",
            district: "DISTRICT 10",
            count: 5,
            lastUpdated: formatDateString("2021-10-27"),
            mostSevereViolation: "ALL",
            numberOfViolations: "ALL",
            supervisionType: "ALL",
            lengthOfStay: "ALL",
            officerName: "ALL",
            populationProportion: "8",
            race: "ALL",
            supervisionLevel: "ALL",
            timePeriod: "6",
          },
        ]);
      });
    });
  });
});
