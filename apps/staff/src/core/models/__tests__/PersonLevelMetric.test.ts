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

import { runInAction } from "mobx";

import { callNewMetricsApi } from "../../../api/metrics/metricsClient";
import RootStore from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import CoreStore from "../../CoreStore";
import { FILTER_TYPES } from "../../utils/constants";
import { defaultTableColumnsWidths } from "../../utils/enabledTableColumns";
import PersonLevelMetric from "../PersonLevelMetric";

vi.mock("../../../RootStore");
vi.mock("../../../api/metrics/metricsClient");

const mockTenantId = "US_TN";
const mockRootStore = {
  userStore: {} as UserStore,
  tenantStore: { currentTenantId: mockTenantId } as TenantStore,
};
const mockCoreStore: CoreStore = new CoreStore(mockRootStore);

describe("PersonLevelMetric", () => {
  let metric: PersonLevelMetric;

  beforeEach(() => {
    vi.mocked(RootStore).getTokenSilently.mockResolvedValue("auth token");

    vi.mocked(callNewMetricsApi).mockResolvedValue({
      data: [
        {
          stateId: "1",
          fullName: "Barney Rubble",
          admissionReason: "NEW_ADMISSION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18, 20",
          facility: "Bedrock, School of Rock",
          race: "HISPANIC",
        },
        {
          stateId: "2",
          fullName: "Fred Flinstone",
          admissionReason: "REVOCATION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          race: "HISPANIC",
        },
        {
          stateId: "3",
          fullName: "Betty",
          admissionReason: "REVOCATION",
          gender: "MALE",
          ageGroup: "<25",
          age: "18",
          facility: "School of Rock",
          race: "HISPANIC",
        },
        {
          stateId: "4",
          fullName: "Wilma Flinstone",
          admissionReason: "NEW_ADMISSION",
          gender: "FEMALE",
          ageGroup: "<25",
          age: "18",
          facility: "Bedrock",
          race: "HISPANIC",
        },
      ],
      metadata: {
        lastUpdated: "2022-01-01",
      },
    });

    mockCoreStore.setPage("prison");
    mockCoreStore.setSection("personLevelDetail");
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

  it("fetches metrics when initialized", () => {
    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `pathways/${mockTenantId}/PrisonPopulationPersonLevel?filters[time_period]=months_0_6`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("sets hydration state", () => {
    expect(metric.hydrationState.status).toBe("hydrated");
  });

  it("sets isEmpty to false", () => {
    expect(metric.isEmpty).toEqual(false);
  });

  it("sets isEmpty to true when there is no data", () => {
    vi.mock("../../../api/metrics/metricsClient", () => {
      return {
        callNewMetricsApi: vi.fn().mockResolvedValue({}),
      };
    });

    metric = new PersonLevelMetric({
      id: "prisonPopulationPersonLevel",
      rootStore: new CoreStore(mockRootStore),
      endpoint: "PrisonPopulationPersonLevel",
    });
    metric.hydrate();

    expect(metric.isEmpty).toEqual(true);
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
        `pathways/${mockTenantId}/PrisonPopulationPersonLevel?filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[facility]=Bedrock`,
      ),
      RootStore.getTokenSilently,
      expect.any(AbortSignal),
    );
  });

  it("has the correct columns", () => {
    const expected = [
      {
        Header: "Name",
        accessor: "fullName",
        useTitleCase: true,
        useFilterLabels: false,
        width: defaultTableColumnsWidths.name,
      },
      {
        Header: "DOC ID",
        accessor: "stateId",
        useFilterLabels: false,
        width: defaultTableColumnsWidths.id,
      },
      {
        Header: "Gender",
        accessor: "gender",
        useFilterLabels: true,
        width: defaultTableColumnsWidths.gender,
      },
      {
        Header: "Age",
        accessor: "age",
        useFilterLabels: false,
        width: defaultTableColumnsWidths.age,
      },
      {
        Header: "Facility",
        accessor: "facility",
        useFilterLabels: false,
        width: defaultTableColumnsWidths.facility,
      },
      {
        Header: "Admission Reason",
        accessor: "admissionReason",
        useFilterLabels: true,
        width: defaultTableColumnsWidths.admissionReason,
      },
      {
        Header: "Race",
        accessor: "race",
        useFilterLabels: true,
        width: defaultTableColumnsWidths.race,
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
