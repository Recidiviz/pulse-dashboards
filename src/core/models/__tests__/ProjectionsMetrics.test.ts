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
import { CORE_VIEWS } from "../../views";
import ProjectionsMetrics from "../ProjectionsMetrics";

const mockTenantId = "US_ND";
const mockCoreStore = {} as CoreStore;
const filtersStore = new FiltersStore({ rootStore: mockCoreStore });
jest.mock("../../../RootStore", () => ({
  getTokenSilently: jest.fn(),
}));

jest.mock("../../../api/metrics/metricsClient", () => {
  return {
    callMetricsApi: jest.fn().mockResolvedValue({
      population_projection_timeseries: [
        {
          compartment: "INCARCERATION",
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
          compartment: "SUPERVISION",
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
          compartment: "INCARCERATION",
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

describe("ProjectionsMetrics", () => {
  let metric: ProjectionsMetrics;

  beforeEach(() => {
    metric = new ProjectionsMetrics({
      tenantId: mockTenantId,
      sourceEndpoint: "practices",
    });
  });

  it("fetches metrics when initialized", () => {
    expect(callMetricsApi).toHaveBeenCalledWith(
      `${mockTenantId.toLowerCase()}/practices`,
      RootStore.getTokenSilently
    );
  });

  it("sets apiData to the resolved fetched value", () => {
    expect(metric.apiData).toHaveProperty("population_projection_timeseries");
  });

  it("sets isLoading to false", () => {
    expect(metric.isLoading).toEqual(false);
  });

  it("has a transformed timeSeries property", () => {
    expect(metric.timeSeries).toContainEqual({
      compartment: "SUPERVISION",
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

  it("sorts timeseries records in ASC order", () => {
    expect(
      metric.timeSeries.map((record) => ({
        month: record.month,
        year: record.year,
      }))
    ).toEqual([
      { month: 12, year: 2015 },
      { month: 1, year: 2016 },
      { month: 5, year: 2016 },
    ]);
  });

  it("finds the simulation month", () => {
    expect(metric.simulationDate).toEqual(new Date(2016, 4));
  });

  it("does not throw when accessing the simluation date without loaded data", () => {
    jest.mock("../../../api/metrics/metricsClient", () => {
      return {
        callMetricsApi: jest.fn().mockResolvedValue({
          population_projection_time_series: [],
        }),
      };
    });

    metric = new ProjectionsMetrics({
      tenantId: mockTenantId,
      sourceEndpoint: "practices",
    });

    expect(metric.simulationDate).toEqual(new Date(9999, 11, 31));
  });

  describe("getFilteredDataByView", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore = filtersStore;
      metric = new ProjectionsMetrics({
        tenantId: mockTenantId,
        sourceEndpoint: "practices",
        rootStore: mockCoreStore,
      });
    });

    it("returns facilities time series on the facilities view", () => {
      const filteredData = metric.getFilteredDataByView(CORE_VIEWS.facilities);
      expect(
        filteredData
          .map((d) => d.compartment)
          .every((d) => d === "INCARCERATION")
      ).toBeTrue();
    });

    it("returns community time series on the community view", () => {
      const filteredData = metric.getFilteredDataByView(CORE_VIEWS.community);
      expect(
        filteredData.map((d) => d.compartment).every((d) => d === "SUPERVISION")
      ).toBeTrue();
    });
  });

  describe("filterTimeSeriesData", () => {
    beforeEach(() => {
      mockCoreStore.filtersStore = filtersStore;

      metric = new ProjectionsMetrics({
        tenantId: mockTenantId,
        sourceEndpoint: "practices",
        rootStore: mockCoreStore,
      });
    });

    it("filters by default values", () => {
      expect(metric.filteredFacilitiesTimeSeries).toEqual([
        {
          compartment: "INCARCERATION",
          gender: "ALL",
          legalStatus: "ALL",
          month: 12,
          simulationTag: "HISTORICAL",
          totalPopulation: 7641,
          totalPopulationMax: 7641,
          totalPopulationMin: 7641,
          year: 2015,
        },
      ]);
      expect(metric.filteredCommunityTimeSeries).toEqual([
        {
          compartment: "SUPERVISION",
          gender: "ALL",
          legalStatus: "ALL",
          month: 1,
          simulationTag: "HISTORICAL",
          totalPopulation: 7641,
          totalPopulationMax: 7641,
          totalPopulationMin: 7641,
          year: 2016,
        },
      ]);
    });

    it("updates when the filters change", () => {
      runInAction(() => {
        if (metric.rootStore) {
          metric.rootStore.filtersStore.setFilters({ gender: "MALE" });
        }

        expect(metric.filteredFacilitiesTimeSeries).toEqual([
          {
            compartment: "INCARCERATION",
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
});
