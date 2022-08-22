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
import PersonLevelMetric from "../PersonLevelMetric";

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
    callNewMetricsApi: jest.fn().mockResolvedValue({
      data: [
        {
          stateId: "1",
          fullName: "Barney Rubble",
          admissionReason: "NEW_ADMISSION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18, 20",
          facility: "Bedrock, School of Rock",
          race: "EARTHLING",
        },
        {
          stateId: "2",
          fullName: "Fred Flinstone",
          admissionReason: "SANCTION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          race: "EARTHLING",
        },
        {
          stateId: "3",
          fullName: "Betty",
          admissionReason: "SANCTION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          race: "EARTHLING",
        },
        {
          stateId: "4",
          fullName: "Wilma Flinstone",
          admissionReason: "NEW_ADMISSION",
          gender: "FEMALE",
          ageGroup: "<25",
          age: "18",
          facility: "Bedrock",
          race: "EARTHLING",
        },
      ],
      metadata: {
        lastUpdated: "2022-01-01",
      },
    }),
  };
});

describe("PersonLevelMetric", () => {
  let metric: PersonLevelMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_DEPLOY_ENV: "dev",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    mockCoreStore.filtersStore.resetFilters();
    metric = new PersonLevelMetric({
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
    metric.hydrate();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("fetches metrics when initialized", () => {
    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `${mockTenantId}/PrisonPopulationPersonLevel?filters[time_period]=months_0_6`
      ),
      RootStore.getTokenSilently
    );
  });

  it("sets isLoading to false", () => {
    expect(metric.isLoading).toEqual(false);
  });

  it("calls the backend again when filters change", () => {
    runInAction(() => {
      metric.rootStore?.filtersStore.setFilters({
        gender: ["MALE"],
        facility: ["Bedrock"],
      });
    });

    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `${mockTenantId}/PrisonPopulationPersonLevel?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[facility]=Bedrock`
      ),
      RootStore.getTokenSilently
    );
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
        accessor: "admissionReason",
        titleCase: true,
      },
      {
        Header: "Race",
        accessor: "race",
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
              Age: "18, 20",
              "DOC ID": "1",
              Facility: "Bedrock, School of Rock",
              Gender: "Male",
              Race: "Earthling",
            },
            {
              "Admission Reason": "Sanction",
              Age: "18",
              "DOC ID": "2",
              Facility: "School of Rock",
              Gender: "Male",
              Race: "Earthling",
            },
            {
              "Admission Reason": "Sanction",
              Age: "18",
              "DOC ID": "3",
              Facility: "School of Rock",
              Gender: "Male",
              Race: "Earthling",
            },
            {
              "Admission Reason": "New Admission",
              Age: "18",
              "DOC ID": "4",
              Facility: "Bedrock",
              Gender: "Female",
              Race: "Earthling",
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
