// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import TasksFilterStore from "../TasksFilterStore";

const mockAnalyticsStore = {
  trackTaskFilterSelected: vi.fn(),
  trackTaskFilterChanged: vi.fn(),
  trackTaskTableCategorySelected: vi.fn(),
  trackTaskFiltersReset: vi.fn(),
  trackTaskFiltersCleared: vi.fn(),
  trackTaskViewChanged: vi.fn(),
} as any as AnalyticsStore;

const mockTenantStore = {
  taskCategories: ["ALL_TASKS", "OVERDUE", "DUE_THIS_WEEK", "DUE_THIS_MONTH"],
  tasksConfiguration: {
    tasks: {
      assessment: {
        constructor: vi.fn(),
      },
      employment: {
        constructor: vi.fn(),
      },
    },
    filters: [
      {
        field: "supervisionLevel",
        type: "person",
        options: [
          { value: "Low" },
          { value: "Medium" },
          { value: "High" },
          { value: "Limited" },
        ],
      },
      {
        field: "district",
        type: "person",
        options: [
          { value: "D1" },
          { value: "D31" },
          { value: "D10" },
          { value: "D7" },
        ],
      },
      {
        field: "type",
        type: "task",
        options: [
          { value: "employment" },
          { value: "assessment" },
          { value: "homeVisit" },
          { value: "contact" },
        ],
      },
    ],
  },
} as any as TenantStore;

const mockWorkflowsStore = {
  caseloadPersons: [],
  searchStore: { selectedSearchIds: ["1", "2"] },
} as any as WorkflowsStore;

let filterStore: TasksFilterStore;

beforeEach(() => {
  filterStore = new TasksFilterStore(
    mockAnalyticsStore,
    mockTenantStore,
    mockWorkflowsStore,
  );
});

it("logs filter changes", () => {
  filterStore.unsetFilter("supervisionLevel", { value: "Low" });

  expect(mockAnalyticsStore.trackTaskFilterChanged).toHaveBeenLastCalledWith({
    changedFilterValue: "Low",
    changedFilterCategory: "supervisionLevel",
    changedFilterSelected: false,
    selectedFilters: {},
    onlyClicked: false,
  });

  filterStore.unsetFilter("supervisionLevel", { value: "High" });

  expect(mockAnalyticsStore.trackTaskFilterChanged).toHaveBeenLastCalledWith({
    changedFilterValue: "High",
    changedFilterCategory: "supervisionLevel",
    changedFilterSelected: false,
    onlyClicked: false,
    selectedFilters: {},
  });

  filterStore.setOnlyFilterForField("district", { value: "D31" });

  expect(mockAnalyticsStore.trackTaskFilterChanged).toHaveBeenLastCalledWith({
    changedFilterValue: "D31",
    changedFilterCategory: "district",
    changedFilterSelected: true,
    onlyClicked: true,
    selectedFilters: {
      district: ["D31"],
    },
  });
});

describe("storing filter state", () => {
  it("starts with no filters selected", () => {
    expect(filterStore.selectedFilters).toEqual({});
  });

  it("stores multiple selected filters", () => {
    filterStore.setOnlyFilterForField("supervisionLevel", {
      value: "Low",
    });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();

    filterStore.setFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();
  });

  it("setFilter() does not deselect selected filters", () => {
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();

    filterStore.setFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();

    filterStore.unsetFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();
  });

  it("resetting sets all filters", () => {
    filterStore.setOnlyFilterForField("supervisionLevel", {
      value: "Low",
    });
    filterStore.setFilter("supervisionLevel", { value: "High" });
    filterStore.setOnlyFilterForField("caseType", {
      value: "general",
    });
    filterStore.setOnlyFilterForField("displayName", {
      value: "Bob",
    });
    filterStore.selectAllFilters();
    expect(filterStore.selectedFilters).toEqual({
      district: ["D1", "D31", "D10", "D7"],
      supervisionLevel: ["Low", "Medium", "High", "Limited"],
      type: ["employment", "assessment", "homeVisit", "contact"],
    });

    expect(mockAnalyticsStore.trackTaskFiltersReset).toHaveBeenLastCalledWith({
      selectedFiltersBeforeReset: {
        caseType: ["general"],
        displayName: ["Bob"],
        supervisionLevel: ["Low", "High"],
      },
    });
  });

  it("clearing sets a cleared entry for all filter fields", () => {
    filterStore.clearFilters();
    expect(filterStore.selectedFilters).toEqual({
      district: undefined,
      supervisionLevel: undefined,
      type: undefined,
    });

    expect(
      mockAnalyticsStore.trackTaskFiltersCleared,
    ).toHaveBeenLastCalledWith();
  });

  it("toggles filters", () => {
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();

    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();
  });

  it("can toggle multiple filters", () => {
    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    filterStore.toggleFilter("supervisionLevel", { value: "Low" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();

    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();

    filterStore.toggleFilter("district", { value: "District 10" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();
    expect(
      filterStore.filterIsSelected("district", {
        value: "District 10",
      }),
    ).toBeTrue();
  });

  it("can track when all filters are selected", () => {
    // By default, no filters are selected
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Select high
    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Select low
    filterStore.toggleFilter("supervisionLevel", { value: "Low" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Deselect high
    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Deselect low
    filterStore.toggleFilter("supervisionLevel", { value: "Low" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Reselect all
    filterStore.selectAllFilters();
    expect(filterStore.allFiltersSelected).toBeTrue();
    // Deselect all
    filterStore.clearFilters();
    expect(filterStore.allFiltersSelected).toBeFalse();
  });
});
