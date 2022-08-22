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
import SnapshotMetric from "../SnapshotMetric";
import { createLibertyPopulationSnapshot } from "../utils";

const OLD_ENV = process.env;

const mockTenantId = "US_TN";
const mockRootStore = {
  userStore: {} as UserStore,
  tenantStore: { currentTenantId: mockTenantId } as TenantStore,
};
const mockCoreStore: CoreStore = new CoreStore(mockRootStore);

global.fetch = jest.fn().mockResolvedValue({
  blob: () => "blob",
});

jest.mock("../../../api/metrics/metricsClient", () => {
  return {
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

describe("SnapshotMetric", () => {
  let metric: SnapshotMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_DEPLOY_ENV: "dev",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    mockCoreStore.filtersStore.resetFilters();
    metric = new SnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      tenantId: mockTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      endpoint: "LibertyToPrisonTransitionsCount",
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
  });

  it("fetches metrics when initialized", () => {
    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `${mockTenantId}/LibertyToPrisonTransitionsCount?group=judicial_district&filters[time_period]=months_0_6`
      ),
      RootStore.getTokenSilently
    );
  });

  it("returns the correct total count", () => {
    expect(metric.totalCount).toBe(250);
  });

  it("calls the backend again when filters change", () => {
    runInAction(() => {
      metric.rootStore?.filtersStore.setFilters({
        gender: ["MALE"],
        judicialDistrict: ["JUDICIAL_DISTRICT_1", "JUDICIAL_DISTRICT_2"],
      });
    });

    expect(callNewMetricsApi).toHaveBeenCalledWith(
      encodeURI(
        `${mockTenantId}/LibertyToPrisonTransitionsCount?group=judicial_district&filters[time_period]=months_0_6` +
          `&filters[gender]=MALE&filters[judicial_district]=JUDICIAL_DISTRICT_1&filters[judicial_district]=JUDICIAL_DISTRICT_2`
      ),
      RootStore.getTokenSilently
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
