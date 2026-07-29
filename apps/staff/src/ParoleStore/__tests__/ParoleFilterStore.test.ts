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

import { ParoleFilterStore } from "../ParoleFilterStore";

describe("ParoleFilterStore", () => {
  let filterValues: Record<"facility" | "hearingType", Array<string>>;
  let filterStore: ParoleFilterStore;

  beforeEach(() => {
    filterValues = {
      facility: [
        "Sterling Correctional Facility",
        "Fremont Correctional Facility",
      ],
      hearingType: ["Parole Grant Hearing", "Revocation Hearing"],
    };
    filterStore = new ParoleFilterStore(() => filterValues);
  });

  describe("filterConfig", () => {
    it("builds a Facility and Hearing Type section from the current filter values", () => {
      expect(filterStore.filterConfig).toEqual({
        filters: [
          {
            title: "Facility",
            type: "parole",
            field: "facility",
            options: [
              { value: "Sterling Correctional Facility" },
              { value: "Fremont Correctional Facility" },
            ],
          },
          {
            title: "Hearing Type",
            type: "parole",
            field: "hearingType",
            options: [
              { value: "Parole Grant Hearing" },
              { value: "Revocation Hearing" },
            ],
          },
        ],
      });
    });

    it("reflects the latest filter values on every access, not just at construction", () => {
      filterValues.facility.push("La Vista Correctional Facility");

      expect(filterStore.filterConfig.filters?.[0].options).toEqual([
        { value: "Sterling Correctional Facility" },
        { value: "Fremont Correctional Facility" },
        { value: "La Vista Correctional Facility" },
      ]);
    });
  });

  describe("filter selection", () => {
    it("starts with no filters selected", () => {
      expect(filterStore.selectedFilters).toEqual({});
      expect(filterStore.numFiltersSet).toBe(0);
    });

    it("toggleFilter selects and then deselects an option", () => {
      const option = { value: "Sterling Correctional Facility" };

      filterStore.toggleFilter("facility", option);
      expect(filterStore.filterIsSelected("facility", option)).toBe(true);
      expect(filterStore.numFiltersSet).toBe(1);

      filterStore.toggleFilter("facility", option);
      expect(filterStore.filterIsSelected("facility", option)).toBe(false);
      expect(filterStore.numFiltersSet).toBe(0);
    });

    it("setOnlyFilterForField replaces the field's selection with a single option", () => {
      filterStore.setFilter("facility", {
        value: "Sterling Correctional Facility",
      });
      filterStore.setOnlyFilterForField("facility", {
        value: "Fremont Correctional Facility",
      });

      expect(filterStore.selectedFilters.facility).toEqual([
        "Fremont Correctional Facility",
      ]);
    });

    it("selectAllFilters selects every option for every field", () => {
      filterStore.selectAllFilters();

      expect(filterStore.selectedFilters).toEqual({
        facility: [
          "Sterling Correctional Facility",
          "Fremont Correctional Facility",
        ],
        hearingType: ["Parole Grant Hearing", "Revocation Hearing"],
      });
      expect(filterStore.allFiltersSelected).toBe(true);
    });

    it("clearFilters resets all selections", () => {
      filterStore.selectAllFilters();
      filterStore.clearFilters();

      expect(filterStore.selectedFilters).toEqual({});
      expect(filterStore.allFiltersSelected).toBe(false);
    });
  });
});
