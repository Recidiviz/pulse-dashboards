// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  defaultPopulationFilterValues,
  NyPopulationFilterOptions,
} from "~shared-pathways";

import MetricsStore from "../MetricsStore";
import { RootStore } from "../RootStore";
import UserStore from "../UserStore";

vi.mock("../UserStore");
vi.mock("../MetricsStore");

let rootStore: RootStore;

beforeEach(() => {
  // @ts-expect-error — partial mock
  vi.mocked(UserStore).mockImplementation(() => ({
    getTokenSilently: vi.fn(),
  }));
  vi.mocked(MetricsStore).mockImplementation(() => ({
    // @ts-expect-error — partial mock of current metric
    current: {
      filters: {
        enabledFilters: [],
      },
      hydrationState: {
        status: "hydrated",
      },
      dynamicFilterOptions: {},
    },
  }));

  rootStore = new RootStore();
});

describe("FiltersStore", () => {
  describe("default filter values", () => {
    it("are set correctly by default", () => {
      expect(rootStore.filtersStore.filters).toEqual(
        defaultPopulationFilterValues,
      );
    });
  });

  describe("setFilters", () => {
    it("updates the filter values", () => {
      const expected = {
        ...defaultPopulationFilterValues,
        sex: ["FEMALE"],
      };
      rootStore.filtersStore.setFilters({ sex: ["FEMALE"] });
      expect(rootStore.filtersStore.filters).toEqual(expected);
    });

    it("defaults to ALL if the filter value is not loaded yet", () => {
      const expected = {
        ...defaultPopulationFilterValues,
        facility: ["ALL"],
      };
      rootStore.filtersStore.setFilters({ facility: [] });
      expect(rootStore.filtersStore.filters).toEqual(expected);
    });
  });

  describe("timePeriodLabel", () => {
    it("returns the time period label", () => {
      rootStore.filtersStore.setFilters({ timePeriod: ["3"] });
      expect(rootStore.filtersStore.timePeriodLabel).toEqual("3 months");
    });
  });

  describe("monthRange", () => {
    it("returns the month range", () => {
      rootStore.filtersStore.setFilters({ timePeriod: ["60"] });
      expect(rootStore.filtersStore.monthRange).toEqual(60);
    });
  });

  describe("filtersDescription", () => {
    it("returns the correct description when admissionReason is enabled", () => {
      rootStore.metricsStore.current.filters.enabledFilters = [
        "timePeriod",
        "sex",
        "admissionReason",
      ];
      rootStore.filtersStore.setFilters({
        timePeriod: ["6"],
        admissionReason: ["NEW_ADMISSION"],
      });
      expect(rootStore.filtersStore.filtersDescription).toEqual(
        "Time Period: 6 months;\nSex: All;\nAdmission Reason: New court commitment\n",
      );
    });

    it("returns the correct description when supervisionType is enabled", () => {
      rootStore.metricsStore.current.filters.enabledFilters = [
        "timePeriod",
        "sex",
        "supervisionType",
      ];
      rootStore.filtersStore.setFilters({
        timePeriod: ["12"],
        supervisionType: ["PAROLE"],
      });
      expect(rootStore.filtersStore.filtersDescription).toEqual(
        "Time Period: 1 year;\nSex: All;\nSupervision Type: Parole/Dual\n",
      );
    });

    it("returns the correct description when multiple options of one filter are selected", () => {
      rootStore.metricsStore.current.filters.enabledFilters = [
        "timePeriod",
        "sex",
        "ageGroup",
      ];
      rootStore.filtersStore.setFilters({
        timePeriod: ["12"],
        ageGroup: ["25-29", "30-34"],
      });

      expect(rootStore.filtersStore.filtersDescription).toEqual(
        "Time Period: 1 year;\nSex: All;\nAge: 25-29, 30-34\n",
      );
    });
  });

  describe("dynamicFilterOptions with useDynamicOptions config set to true", () => {
    it("sets filterOptions with the dynamicFilterOptions from the current metric", () => {
      rootStore.metricsStore.current.dynamicFilterOptions["facility"] = [
        { label: "Option 1", value: "OPTION_1" },
        { label: "Option 2", value: "OPTION_2" },
      ];
      const expected = { ...NyPopulationFilterOptions };
      expected.facility = {
        ...expected.facility,
        options: [
          { label: "All", value: "ALL" },
          ...rootStore.metricsStore.current.dynamicFilterOptions["facility"],
        ],
      };
      expect(rootStore.filtersStore.filterOptions).toEqual(expected);
    });
  });

  describe("pathwaysTenantId", () => {
    it("returns the tenant id from the root store", () => {
      expect(rootStore.filtersStore.pathwaysTenantId).toEqual("US_NY");
    });
  });
});
