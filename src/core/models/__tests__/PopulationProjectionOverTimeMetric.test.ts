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
import PopulationProjectionOverTimeMetric from "../PopulationProjectionOverTimeMetric";
import { createProjectionTimeSeries } from "../utils";

const OLD_ENV = process.env;

const mockTenantId = "US_ID";
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
      prison_population_projection_time_series: [
        {
          gender: "MALE",
          legal_status: "ALL",
          month: "5",
          simulation_tag: "HISTORICAL",
          state_code: "US_ID",
          total_population: 7641,
          total_population_max: 7641,
          total_population_min: 7641,
          year: "2016",
        },
        {
          gender: "ALL",
          legal_status: "ALL",
          month: "1",
          simulation_tag: "HISTORICAL",
          state_code: "US_ID",
          total_population: 7641,
          total_population_max: 7641,
          total_population_min: 7641,
          year: "2016",
        },
        {
          gender: "ALL",
          legal_status: "ALL",
          month: "12",
          simulation_tag: "HISTORICAL",
          state_code: "US_ID",
          total_population: 7641,
          total_population_max: 7641,
          total_population_min: 7641,
          year: "2015",
        },
      ],
    }),
  };
});

describe("PopulationProjectionOverTimeMetric", () => {
  let metric: PopulationProjectionOverTimeMetric;

  beforeEach(() => {
    process.env = Object.assign(process.env, {
      REACT_APP_API_URL: "test-url",
    });
    mockCoreStore.filtersStore = filtersStore;
    metric = new PopulationProjectionOverTimeMetric({
      id: "projectedPrisonPopulationOverTime",
      tenantId: mockTenantId,
      compartment: "INCARCERATION",
      sourceFilename: "prison_population_projection_time_series",
      dataTransformer: createProjectionTimeSeries,
      enabledFilters: [FILTER_TYPES.LEGAL_STATUS, FILTER_TYPES.GENDER],
      rootStore: mockCoreStore,
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
      `${mockTenantId.toLowerCase()}/pathways/prison_population_projection_time_series`,
      RootStore.getTokenSilently
    );
  });

  it("sets isLoading to false", () => {
    expect(metric.isLoading).toEqual(false);
  });

  it("has a transformed records property", () => {
    expect(metric.records).toContainEqual({
      gender: "ALL",
      legalStatus: "ALL",
      month: 1,
      simulationTag: "HISTORICAL",
      totalPopulation: 7641,
      totalPopulationMax: 7641,
      totalPopulationMin: 7641,
      year: 2016,
    });
  });

  it("finds the simulation month", () => {
    expect(metric.simulationDate).toEqual(new Date(2015, 11));
  });

  it("does not throw when accessing the simluation date without loaded data", () => {
    jest.mock("../../../api/metrics/metricsClient", () => {
      return {
        callMetricsApi: jest.fn().mockResolvedValue({
          prison_population_projection_time_series: [],
        }),
      };
    });

    metric = new PopulationProjectionOverTimeMetric({
      id: "projectedPrisonPopulationOverTime",
      tenantId: mockTenantId,
      compartment: "INCARCERATION",
      sourceFilename: "prison_population_projection_time_series",
      dataTransformer: createProjectionTimeSeries,
      enabledFilters: [FILTER_TYPES.LEGAL_STATUS, FILTER_TYPES.GENDER],
      rootStore: mockCoreStore,
    });
    metric.hydrate();

    expect(metric.simulationDate).toEqual(new Date(9999, 11, 31));
  });

  describe("dataSeries", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore = filtersStore;

      metric = new PopulationProjectionOverTimeMetric({
        id: "projectedPrisonPopulationOverTime",
        tenantId: mockTenantId,
        compartment: "INCARCERATION",
        sourceFilename: "prison_population_projection_time_series",
        dataTransformer: createProjectionTimeSeries,
        enabledFilters: [FILTER_TYPES.LEGAL_STATUS, FILTER_TYPES.GENDER],
        rootStore: mockCoreStore,
      });
      metric.hydrate();
    });

    it("filters by default values", () => {
      expect(metric.dataSeries).toEqual([
        {
          year: 2016,
          month: 1,
          compartment: undefined,
          legalStatus: "ALL",
          gender: "ALL",
          simulationTag: "HISTORICAL",
          totalPopulation: 7641,
          totalPopulationMax: 7641,
          totalPopulationMin: 7641,
        },
        {
          year: 2015,
          month: 12,
          compartment: undefined,
          legalStatus: "ALL",
          gender: "ALL",
          simulationTag: "HISTORICAL",
          totalPopulation: 7641,
          totalPopulationMax: 7641,
          totalPopulationMin: 7641,
        },
      ]);
    });

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({ gender: "MALE" });
        }

        expect(metric.dataSeries).toEqual([
          {
            compartment: undefined,
            gender: "MALE",
            legalStatus: "ALL",
            month: 5,
            simulationTag: "HISTORICAL",
            totalPopulation: 7641,
            totalPopulationMax: 7641,
            totalPopulationMin: 7641,
            year: 2016,
          },
        ]);
      });
    });
  });

  describe("fetchMethodologyPdf", () => {
    let pdf: Record<string, string>;

    beforeEach(async () => {
      pdf = await metric.fetchMethodologyPDF();
    });

    it("successfully fetches the methodology PDF", () => {
      expect(fetch).toHaveBeenCalledWith(
        `test-url/api/${mockTenantId.toLowerCase()}/projections/methodology.pdf`,
        {
          headers: {
            Authorization: `Bearer auth token`,
          },
        }
      );

      expect(pdf).toEqual({
        data: "blob",
        name: "population_projections_methodology.pdf",
        type: "binary",
      });
    });
  });
});
