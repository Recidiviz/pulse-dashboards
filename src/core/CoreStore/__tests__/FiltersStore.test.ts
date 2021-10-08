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
import RootStore from "../../../RootStore";
import { defaultPopulationFilterValues } from "../../utils/filterOptions";
import CoreStore from "..";

let coreStore: CoreStore;

jest.mock("../../../RootStore/UserStore", () => {
  return jest.fn().mockImplementation(() => ({
    user: {},
  }));
});

jest.mock("../../../RootStore/TenantStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentTenantId: "US_ND",
  }));
});

jest.mock("../../../core/CoreStore/MetricsStore", () => {
  return jest.fn().mockImplementation(() => ({
    current: {
      enabledFilters: [],
    },
  }));
});

describe("FiltersStore", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
  });

  describe("default filter values", () => {
    it("are set correctly by default", () => {
      expect(coreStore.filtersStore.filters).toEqual(
        defaultPopulationFilterValues
      );
    });
  });

  describe("setFilters", () => {
    it("updates the filter values", () => {
      const expected = {
        ...defaultPopulationFilterValues,
        gender: "FEMALE",
      };
      coreStore.filtersStore.setFilters({ gender: "FEMALE" });
      expect(coreStore.filtersStore.filters).toEqual(expected);
    });
  });

  describe("timePeriodLabel", () => {
    it("returns the time period label", () => {
      coreStore.filtersStore.setFilters({ timePeriod: "3" });
      expect(coreStore.filtersStore.timePeriodLabel).toEqual("3 months");
    });
  });

  describe("filtersDescription", () => {
    it("returns the correct description when legalStatus is enabled", () => {
      coreStore.metricsStore.current.enabledFilters = [
        "timePeriod",
        "gender",
        "legalStatus",
      ];
      coreStore.filtersStore.setFilters({
        timePeriod: "3",
        legalStatus: "TREATMENT_IN_PRISON",
      });
      expect(coreStore.filtersStore.filtersDescription).toEqual(
        "Time period: 3 months, All genders, Legal status: Rider"
      );
    });

    it("returns the correct description when supervisionType is enabled", () => {
      coreStore.metricsStore.current.enabledFilters = [
        "timePeriod",
        "gender",
        "supervisionType",
      ];
      coreStore.filtersStore.setFilters({
        timePeriod: "12",
        supervisionType: "PAROLE",
      });
      expect(coreStore.filtersStore.filtersDescription).toEqual(
        "Supervision type: Parole/Dual, Time period: 1 year, All genders"
      );
    });
  });
});
