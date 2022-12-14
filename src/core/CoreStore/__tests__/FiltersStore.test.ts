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
    currentTenantId: "US_ID",
  }));
});

jest.mock("../../../core/CoreStore/MetricsStore", () => {
  return jest.fn().mockImplementation(() => ({
    current: {
      filters: {
        enabledFilters: [],
      },
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
        gender: ["FEMALE"],
      };
      coreStore.filtersStore.setFilters({ gender: ["FEMALE"] });
      expect(coreStore.filtersStore.filters).toEqual(expected);
    });
  });

  describe("timePeriodLabel", () => {
    it("returns the time period label", () => {
      coreStore.filtersStore.setFilters({ timePeriod: ["3"] });
      expect(coreStore.filtersStore.timePeriodLabel).toEqual("3 months");
    });
  });

  describe("monthRange", () => {
    it("returns the month range", () => {
      coreStore.filtersStore.setFilters({ timePeriod: ["60"] });
      expect(coreStore.filtersStore.monthRange).toEqual(60);
    });
  });

  describe("filtersDescription", () => {
    it("returns the correct description when admissionReason is enabled", () => {
      coreStore.metricsStore.current.filters.enabledFilters = [
        "timePeriod",
        "gender",
        "admissionReason",
      ];
      coreStore.filtersStore.setFilters({
        timePeriod: ["6"],
        admissionReason: ["NEW_ADMISSION"],
      });
      expect(coreStore.filtersStore.filtersDescription).toEqual(
        "Time Period: 6 months;\nGender: All;\nAdmission Reason: New court commitment\n"
      );
    });

    it("returns the correct description when supervisionType is enabled", () => {
      coreStore.metricsStore.current.filters.enabledFilters = [
        "timePeriod",
        "gender",
        "supervisionType",
      ];
      coreStore.filtersStore.setFilters({
        timePeriod: ["12"],
        supervisionType: ["PAROLE"],
      });
      expect(coreStore.filtersStore.filtersDescription).toEqual(
        "Time Period: 1 year;\nGender: All;\nSupervision Type: Parole/Dual\n"
      );
    });

    it("returns the correct description when more multiple options of one filter are selected", () => {
      coreStore.metricsStore.current.filters.enabledFilters = [
        "timePeriod",
        "gender",
        "facility",
      ];
      coreStore.filtersStore.setFilters({
        timePeriod: ["12"],
        facility: ["CAPP", "ISCC"],
      });
      expect(coreStore.filtersStore.filtersDescription).toEqual(
        "Time Period: 1 year;\nGender: All;\nFacility: CAPP, ISCC\n"
      );
    });
  });
});
