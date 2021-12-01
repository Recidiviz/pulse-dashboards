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
import { defaultPopulationFilterValues } from "../../utils/filterOptions";
import PrisonPopulationPersonLevelMetric from "../PrisonPopulationPersonLevelMetric";
import {
  createPrisonPopulationPersonLevelList,
  formatDateString,
} from "../utils";

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
        },
        {
          state_id: "1",
          full_name: "Fred Flinstone",
          last_updated: "2021-11-1",
          legal_status: "SANCTION",
          gender: "MALE",
          age_group: "<25",
          age: "18",
          facility: "School of Rock",
        },
        {
          state_id: "1",
          full_name: "Wilma Flinstone",
          last_updated: "2021-11-1",
          legal_status: "NEW_ADMISSION",
          gender: "FEMALE",
          age_group: "<25",
          age: "18",
          facility: "Bedrock",
        },
      ],
    }),
  };
});

describe("PrisonPopulationPersonLevelMetric", () => {
  let metric: PrisonPopulationPersonLevelMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
    });
    mockCoreStore.filtersStore = filtersStore;
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
        legalStatus: "NEW_ADMISSION",
        gender: "MALE",
        ageGroup: "<25",
        age: "18",
        facility: "Bedrock",
      },
      {
        stateId: "1",
        fullName: "Fred Flinstone",
        lastUpdated: formatDateString("2021-11-1"),
        legalStatus: "SANCTION",
        gender: "MALE",
        ageGroup: "<25",
        age: "18",
        facility: "School of Rock",
      },
      {
        stateId: "1",
        fullName: "Wilma Flinstone",
        lastUpdated: formatDateString("2021-11-1"),
        legalStatus: "NEW_ADMISSION",
        gender: "FEMALE",
        ageGroup: "<25",
        age: "18",
        facility: "Bedrock",
      },
    ]);
  });

  describe("dataSeries", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore = filtersStore;

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
          ],
        },
      });
      metric.hydrate();
    });

    it("filters by default values", () => {
      expect(metric.dataSeries).toEqual([
        {
          stateId: "1",
          fullName: "Barney Rubble",
          lastUpdated: formatDateString("2021-11-1"),
          legalStatus: "NEW_ADMISSION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "Bedrock",
        },
        {
          stateId: "1",
          fullName: "Fred Flinstone",
          lastUpdated: formatDateString("2021-11-1"),
          legalStatus: "SANCTION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
        },
        {
          stateId: "1",
          fullName: "Wilma Flinstone",
          lastUpdated: formatDateString("2021-11-1"),
          legalStatus: "NEW_ADMISSION",
          gender: "FEMALE",
          ageGroup: "<25",
          age: "18",
          facility: "Bedrock",
        },
      ]);
    });

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({
            gender: "MALE",
            facility: ["Bedrock"],
          });
        }

        expect(metric.dataSeries).toEqual([
          {
            stateId: "1",
            fullName: "Barney Rubble",
            lastUpdated: formatDateString("2021-11-1"),
            legalStatus: "NEW_ADMISSION",
            gender: "MALE",
            ageGroup: "<25",
            age: "18",
            facility: "Bedrock",
          },
        ]);
      });
    });
  });

  describe("when the currentTenantId is US_TN", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore = filtersStore;

      if (metric.rootStore) {
        metric.rootStore.filtersStore.setFilters(defaultPopulationFilterValues);
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
          titleCase: true,
          width: 150,
        },
        {
          Header: "DOC ID",
          accessor: "stateId",
          titleCase: false,
          width: 100,
        },
        {
          Header: "Gender",
          accessor: "gender",
          titleCase: true,
          width: 80,
        },
        {
          Header: "Age",
          accessor: "age",
          titleCase: false,
          width: 80,
        },
        {
          Header: "Facility",
          accessor: "facility",
          titleCase: false,
          width: 80,
        },
        {
          Header: "Admission Reason",
          accessor: "legalStatus",
          titleCase: true,
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
                "Admission Reason": "New Admission",
                Age: "18",
                "DOC ID": "1",
                Facility: "Bedrock",
                Gender: "Male",
              },
              {
                "Admission Reason": "Sanction",
                Age: "18",
                "DOC ID": "1",
                Facility: "School of Rock",
                Gender: "Male",
              },
              {
                "Admission Reason": "New Admission",
                Age: "18",
                "DOC ID": "1",
                Facility: "Bedrock",
                Gender: "Female",
              },
            ],
            label: "",
          },
        ],
        chartId: "List of people in prison",
        chartLabels: ["Barney Rubble", "Fred Flinstone", "Wilma Flinstone"],
        dataExportLabel: "Name",
      };
      expect(metric.downloadableData).toEqual(expected);
    });
  });
});
