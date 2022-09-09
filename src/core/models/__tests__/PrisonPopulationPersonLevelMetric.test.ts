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
import PersonLevelMetric from "../PersonLevelMetric";
import PrisonPopulationPersonLevelMetric from "../PrisonPopulationPersonLevelMetric";
import {
  createPrisonPopulationPersonLevelList,
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
global.fetch = jest.fn().mockResolvedValue({
  blob: () => "blob",
});

jest.mock("../../../api/metrics/metricsClient", () => {
  return {
    callMetricsApi: jest.fn().mockResolvedValue({
      prison_population_snapshot_person_level: [
        {
          state_id: "1",
          full_name: "Barney Rubble",
          last_updated: "2021-11-1",
          legal_status: "NEW_ADMISSION",
          gender: "MALE",
          age_group: "<25",
          age: "18",
          facility: "Bedrock",
          time_period: "months_0_6",
          race: "HISPANIC",
        },
        {
          state_id: "1",
          full_name: "Barney Rubble",
          last_updated: "2021-11-1",
          legal_status: "NEW_ADMISSION",
          gender: "MALE",
          age_group: "<25",
          age: "20",
          facility: "School of Rock",
          time_period: "months_0_6",
          race: "HISPANIC",
        },
        {
          state_id: "2",
          full_name: "Fred Flinstone",
          last_updated: "2021-11-1",
          legal_status: "REVOCATION",
          gender: "MALE",
          age_group: "<25",
          age: "18",
          facility: "School of Rock",
          time_period: "months_7_12",
          race: "HISPANIC",
        },
        {
          state_id: "3",
          full_name: "Betty",
          last_updated: "2021-11-1",
          legal_status: "REVOCATION",
          gender: "MALE",
          age_group: "<25",
          age: "18",
          facility: "School of Rock",
          time_period: "months_0_6",
          race: "HISPANIC",
        },
        {
          state_id: "4",
          full_name: "Wilma Flinstone",
          last_updated: "2021-11-1",
          legal_status: "NEW_ADMISSION",
          gender: "FEMALE",
          age_group: "<25",
          age: "18",
          facility: "Bedrock",
          time_period: "months_7_12",
          race: "HISPANIC",
        },
      ],
    }),
    callNewMetricsApi: jest.fn().mockResolvedValue({
      data: [
        {
          stateId: "1",
          fullName: "Barney Rubble",
          gender: "MALE",
          ageGroup: "<25",
          age: "18, 20",
          facility: "Bedrock, School of Rock",
          timePeriod: "months_0_6",
        },
        {
          stateId: "3",
          fullName: "Betty",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          timePeriod: "months_0_6",
        },
      ],
      metadata: {
        lastUpdated: "2022-01-01",
      },
    }),
  };
});

describe("PrisonPopulationPersonLevelMetric", () => {
  let metric: PrisonPopulationPersonLevelMetric;
  let newBackendMetric: PersonLevelMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    metric = new PrisonPopulationPersonLevelMetric({
      id: "prisonPopulationPersonLevel",
      tenantId: mockTenantId,
      sourceFilename: "prison_population_snapshot_person_level",
      rootStore: mockCoreStore,
      hasTimePeriodDimension: true,
      dataTransformer: createPrisonPopulationPersonLevelList,
      filters: {
        enabledFilters: [
          FILTER_TYPES.TIME_PERIOD,
          FILTER_TYPES.GENDER,
          FILTER_TYPES.LEGAL_STATUS,
          FILTER_TYPES.AGE_GROUP,
          FILTER_TYPES.FACILITY,
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
      `${mockTenantId.toLowerCase()}/pathways/prison_population_snapshot_person_level`,
      RootStore.getTokenSilently
    );
  });

  it("sets isLoading to false", () => {
    expect(metric.isLoading).toEqual(false);
  });

  it("has a transformed records property", () => {
    expect(metric.records).toEqual([
      {
        stateId: "1",
        fullName: "Barney Rubble",
        lastUpdated: formatDateString("2021-11-1"),
        admissionReason: "NEW_ADMISSION",
        gender: "MALE",
        ageGroup: "<25",
        age: "18",
        facility: "Bedrock",
        timePeriod: "6",
        race: "HISPANIC",
      },
      {
        stateId: "1",
        fullName: "Barney Rubble",
        lastUpdated: formatDateString("2021-11-1"),
        admissionReason: "NEW_ADMISSION",
        gender: "MALE",
        ageGroup: "<25",
        age: "20",
        facility: "School of Rock",
        timePeriod: "6",
        race: "HISPANIC",
      },
      {
        stateId: "2",
        fullName: "Fred Flinstone",
        lastUpdated: formatDateString("2021-11-1"),
        admissionReason: "REVOCATION",
        gender: "MALE",
        ageGroup: "<25",
        age: "18",
        facility: "School of Rock",
        timePeriod: "12",
        race: "HISPANIC",
      },
      {
        stateId: "3",
        fullName: "Betty",
        lastUpdated: formatDateString("2021-11-1"),
        admissionReason: "REVOCATION",
        gender: "MALE",
        ageGroup: "<25",
        age: "18",
        facility: "School of Rock",
        timePeriod: "6",
        race: "HISPANIC",
      },
      {
        stateId: "4",
        fullName: "Wilma Flinstone",
        lastUpdated: formatDateString("2021-11-1"),
        admissionReason: "NEW_ADMISSION",
        gender: "FEMALE",
        ageGroup: "<25",
        age: "18",
        facility: "Bedrock",
        timePeriod: "12",
        race: "HISPANIC",
      },
    ]);
  });

  describe("dataSeries", () => {
    beforeEach(() => {
      newBackendMetric = new PersonLevelMetric({
        id: "prisonPopulationPersonLevel",
        endpoint: "PrisonPopulationPersonLevel",
        rootStore: mockCoreStore,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.LEGAL_STATUS,
            FILTER_TYPES.AGE_GROUP,
            FILTER_TYPES.FACILITY,
          ],
        },
      });
      metric = new PrisonPopulationPersonLevelMetric({
        id: "prisonPopulationPersonLevel",
        tenantId: mockTenantId,
        sourceFilename: "prison_population_snapshot_person_level",
        rootStore: mockCoreStore,
        hasTimePeriodDimension: true,
        dataTransformer: createPrisonPopulationPersonLevelList,
        filters: {
          enabledFilters: [
            FILTER_TYPES.TIME_PERIOD,
            FILTER_TYPES.GENDER,
            FILTER_TYPES.LEGAL_STATUS,
            FILTER_TYPES.AGE_GROUP,
            FILTER_TYPES.FACILITY,
          ],
        },
        newBackendMetric,
      });
      metric.hydrate();
    });

    it("calls the new API and logs diffs", () => {
      expect(callNewMetricsApi).toHaveBeenCalledWith(
        encodeURI(
          `${mockTenantId}/PrisonPopulationPersonLevel?filters[time_period]=months_0_6`
        ),
        RootStore.getTokenSilently
      );
      expect(metric.diffs?.totalDiffs && metric.diffs?.totalDiffs > 0);
    });

    it("filters by default values", () => {
      expect(metric.dataSeries).toEqual([
        {
          stateId: "1",
          fullName: "Barney Rubble",
          lastUpdated: formatDateString("2021-11-1"),
          admissionReason: "NEW_ADMISSION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18, 20",
          facility: "Bedrock, School of Rock",
          timePeriod: "6",
          race: "HISPANIC",
        },
        {
          stateId: "3",
          fullName: "Betty",
          lastUpdated: formatDateString("2021-11-1"),
          admissionReason: "REVOCATION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          timePeriod: "6",
          race: "HISPANIC",
        },
      ]);
    });

    it("does not filter by timePeriod if hasTimePeriodDimension is false", () => {
      metric.hasTimePeriodDimension = false;
      expect(metric.dataSeries).toEqual([
        {
          stateId: "1",
          fullName: "Barney Rubble",
          lastUpdated: formatDateString("2021-11-1"),
          admissionReason: "NEW_ADMISSION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18, 20",
          facility: "Bedrock, School of Rock",
          timePeriod: "6",
          race: "HISPANIC",
        },
        {
          stateId: "2",
          fullName: "Fred Flinstone",
          lastUpdated: formatDateString("2021-11-1"),
          admissionReason: "REVOCATION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          timePeriod: "12",
          race: "HISPANIC",
        },
        {
          stateId: "3",
          fullName: "Betty",
          lastUpdated: formatDateString("2021-11-1"),
          admissionReason: "REVOCATION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          timePeriod: "6",
          race: "HISPANIC",
        },
        {
          stateId: "4",
          fullName: "Wilma Flinstone",
          lastUpdated: formatDateString("2021-11-1"),
          admissionReason: "NEW_ADMISSION",
          gender: "FEMALE",
          ageGroup: "<25",
          age: "18",
          facility: "Bedrock",
          timePeriod: "12",
          race: "HISPANIC",
        },
      ]);
    });

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            gender: ["MALE"],
            facility: ["Bedrock"],
          });
        }

        expect(metric.dataSeries).toEqual([
          {
            stateId: "1",
            fullName: "Barney Rubble",
            lastUpdated: formatDateString("2021-11-1"),
            admissionReason: "NEW_ADMISSION",
            gender: "MALE",
            ageGroup: "<25",
            age: "18",
            facility: "Bedrock",
            timePeriod: "6",
            race: "HISPANIC",
          },
        ]);
      });
    });
  });

  describe("when the currentTenantId is US_TN", () => {
    beforeEach(() => {
      if (metric.rootStore) {
        metric.rootStore.filtersStore.resetFilters();
      }

      metric = new PrisonPopulationPersonLevelMetric({
        id: "prisonPopulationPersonLevel",
        tenantId: mockTenantId,
        sourceFilename: "prison_population_snapshot_person_level",
        rootStore: mockCoreStore,
        dataTransformer: createPrisonPopulationPersonLevelList,
        filters: {
          enabledFilters: [
            FILTER_TYPES.GENDER,
            FILTER_TYPES.LEGAL_STATUS,
            FILTER_TYPES.AGE_GROUP,
            FILTER_TYPES.FACILITY,
            FILTER_TYPES.RACE,
          ],
        },
      });
      metric.hydrate();
    });

    it("has the correct columns", () => {
      const expected = [
        {
          Header: "Name",
          accessor: "fullName",
          useTitleCase: true,
          useFilterLabels: false,
          width: 150,
        },
        {
          Header: "DOC ID",
          accessor: "stateId",
          useFilterLabels: false,
          width: 100,
        },
        {
          Header: "Gender",
          accessor: "gender",
          useFilterLabels: true,
          width: 80,
        },
        {
          Header: "Age",
          accessor: "age",
          useFilterLabels: false,
          width: 80,
        },
        {
          Header: "Facility",
          accessor: "facility",
          useFilterLabels: false,
          width: 80,
        },
        {
          Header: "Admission Reason",
          accessor: "admissionReason",
          useFilterLabels: true,
        },
        {
          Header: "Race",
          accessor: "race",
          useFilterLabels: true,
        },
      ];
      expect(metric.columns).toEqual(expected);
    });

    it("has the correct downloadableData", () => {
      const expected = {
        chartDatasets: [
          {
            data: [
              {
                "Admission Reason": "New court commitment",
                Age: "18, 20",
                "DOC ID": "1",
                Facility: "Bedrock, School of Rock",
                Gender: "Male",
                Race: "Hispanic",
              },
              {
                "Admission Reason": "Revocation",
                Age: "18",
                "DOC ID": "2",
                Facility: "School of Rock",
                Gender: "Male",
                Race: "Hispanic",
              },
              {
                "Admission Reason": "Revocation",
                Age: "18",
                "DOC ID": "3",
                Facility: "School of Rock",
                Gender: "Male",
                Race: "Hispanic",
              },
              {
                "Admission Reason": "New court commitment",
                Age: "18",
                "DOC ID": "4",
                Facility: "Bedrock",
                Gender: "Female",
                Race: "Hispanic",
              },
            ],
            label: "",
          },
        ],
        chartId: "List of people in prison",
        chartLabels: [
          "Barney Rubble",
          "Fred Flinstone",
          "Betty",
          "Wilma Flinstone",
        ],
        dataExportLabel: "Name",
      };
      expect(metric.downloadableData).toEqual(expected);
    });
  });
});
