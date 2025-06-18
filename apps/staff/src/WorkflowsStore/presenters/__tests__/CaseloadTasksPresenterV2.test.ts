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

import { addDays } from "date-fns";
import tk from "timekeeper";

import { SupervisionTaskCategory } from "../../../core/WorkflowsTasks/fixtures";
import FirestoreStore from "../../../FirestoreStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import TenantStore from "../../../RootStore/TenantStore";
import { JusticeInvolvedPerson } from "../../types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { CaseloadTasksPresenterV2 } from "../CaseloadTasksPresenterV2";

let presenter: CaseloadTasksPresenterV2;

// Freeze time so that tests using isThisWeek() and isThisMonth() are not flakey
const now = new Date(2022, 1, 3);
tk.freeze(now);

const mockAnalyticsStore = {
  trackTaskFilterSelected: vi.fn(),
  trackTaskFilterChanged: vi.fn(),
  trackTaskTableCategorySelected: vi.fn(),
  trackTaskFiltersReset: vi.fn(),
  trackTaskFiltersCleared: vi.fn(),
  trackTaskViewChanged: vi.fn(),
} as any as AnalyticsStore;

const mockTenantStore = {
  taskCategories: ["assessment", "employment"],
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

function makePersonWithTasks(
  taskTypes: SupervisionTaskCategory[],
  {
    overdue = false,
    dateOffset = 0,
    supervisionLevel = "Low",
    district = "D1",
  } = {},
): JusticeInvolvedPerson {
  const tasks = taskTypes.map((type) => ({
    type,
    dueDate: addDays(new Date(), dateOffset),
    isOverdue: overdue,
  }));
  return {
    district,
    supervisionLevel,
    supervisionTasks: {
      readyOrderedTasks: tasks,
      orderedTasks: tasks,
      overdueTasks: overdue ? tasks : [],
      upcomingTasks: overdue ? [] : tasks,
    },
  } as any as JusticeInvolvedPerson;
}

function getPresenter({
  workflowsStore = mockWorkflowsStore,
  tenantStore = mockTenantStore,
  analyticsStore = mockAnalyticsStore,
}): CaseloadTasksPresenterV2 {
  return new CaseloadTasksPresenterV2(
    workflowsStore,
    tenantStore,
    analyticsStore,
    {} as FirestoreStore,
    {},
  );
}

describe("CaseloadTasksPresenterV2", () => {
  describe("taskCategories", () => {
    beforeEach(() => {
      presenter = getPresenter({});
    });

    it("returns taskCategories in the same order as in the tenant store", () => {
      expect(presenter.taskCategories).toEqual(mockTenantStore.taskCategories);
    });
  });

  describe("selectedTaskCategory", () => {
    beforeEach(() => {
      presenter = getPresenter({});
    });

    it("logs category selection to the analytics store", () => {
      presenter.selectedTaskCategory = "employment";
      expect(
        mockAnalyticsStore.trackTaskTableCategorySelected,
      ).toHaveBeenLastCalledWith({
        newTabRowCount: 0,
        previousCategory: "ALL_TASKS",
        selectedCaseloadIds: ["1", "2"],
        selectedCategory: "employment",
      });
    });
  });

  describe("ordered tasks", () => {
    beforeEach(() => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        caseloadPersons: [
          makePersonWithTasks(["employment", "contact"], { dateOffset: 0 }),
          makePersonWithTasks(["employment", "assessment"], { dateOffset: 11 }),
          makePersonWithTasks(["homeVisit"], { dateOffset: 12 }),
          makePersonWithTasks(["homeVisit"], { dateOffset: -1, overdue: true }),
        ],
      } as any as WorkflowsStore;

      presenter = getPresenter({ workflowsStore });
    });

    it("filters by type in orderedTasksForCategory", () => {
      expect(presenter.orderedTasksForCategory("ALL_TASKS")).toHaveLength(6);
      expect(presenter.orderedTasksForCategory("OVERDUE")).toHaveLength(1);
      expect(presenter.orderedTasksForCategory("DUE_THIS_WEEK")).toHaveLength(
        2,
      );
      expect(presenter.orderedTasksForCategory("DUE_THIS_MONTH")).toHaveLength(
        3,
      );
    });

    it("uses stored category for orderedTasksForSelectedCategory", () => {
      presenter.selectedTaskCategory = "ALL_TASKS";
      expect(presenter.orderedTasksForSelectedCategory).toHaveLength(6);
      presenter.selectedTaskCategory = "OVERDUE";
      expect(presenter.orderedTasksForSelectedCategory).toHaveLength(1);
    });

    it("are ordered by due date", () => {
      expect(
        presenter
          .orderedTasksForCategory("DUE_THIS_MONTH")
          .map((t) => t.dueDate),
      ).toEqual([
        addDays(new Date(), 11),
        addDays(new Date(), 11),
        addDays(new Date(), 12),
      ]);
    });
  });

  describe("partitioning overdue tasks", () => {
    beforeEach(() => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        caseloadPersons: [
          makePersonWithTasks(["employment", "contact"], {
            overdue: true,
            dateOffset: -2,
          }),
          makePersonWithTasks(["employment", "assessment"], { dateOffset: 1 }),
          makePersonWithTasks(["homeVisit"], { overdue: true, dateOffset: -1 }),
        ],
      } as any as WorkflowsStore;

      presenter = getPresenter({ workflowsStore });
    });

    it("groups people with overdue tasks together", () => {
      expect(presenter.clientsWithOverdueTasks).toHaveLength(2);
    });

    it("groups people with upcoming tasks together", () => {
      expect(presenter.clientsWithUpcomingTasks).toHaveLength(1);
    });

    it("filters people by selected task types", () => {
      presenter.toggleFilter("type", { value: "employment" });
      expect(presenter.clientsWithUpcomingTasks).toHaveLength(1);
      expect(presenter.clientsWithOverdueTasks).toHaveLength(1);
    });

    it("can filter by a single option", () => {
      presenter.setOnlyFilterForField("type", { value: "employment" });
      expect(presenter.clientsWithUpcomingTasks).toHaveLength(1);
      expect(presenter.clientsWithOverdueTasks).toHaveLength(1);
    });

    it("can filter down to empty lists", () => {
      presenter.setOnlyFilterForField("type", { value: "someOtherType" });
      expect(presenter.clientsWithUpcomingTasks).toHaveLength(0);
      expect(presenter.clientsWithOverdueTasks).toHaveLength(0);
    });
  });

  describe("filtering people", () => {
    beforeEach(() => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        caseloadPersons: [
          makePersonWithTasks(["employment", "contact"], {
            district: "D10",
            supervisionLevel: "Low",
          }),
          makePersonWithTasks(["contact"], {
            district: "D31",
            supervisionLevel: "Low",
            dateOffset: 7,
          }),
          makePersonWithTasks(["contact"], {
            district: "D7",
            supervisionLevel: "Medium",
          }),
          makePersonWithTasks(["employment"], {
            district: "D31",
            supervisionLevel: "Limited",
          }),
        ],
      } as any as WorkflowsStore;

      presenter = getPresenter({ workflowsStore });
    });

    it("returns all tasks when no filters set", () => {
      expect(presenter.countForCategory("ALL_TASKS")).toEqual(5);
      expect(presenter.countForCategory("OVERDUE")).toEqual(0);
      expect(presenter.countForCategory("DUE_THIS_WEEK")).toEqual(4);
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(1);
    });

    it("returns all tasks when a filter is set and then unset", () => {
      presenter.toggleFilter("supervisionLevel", { value: "Low" });
      presenter.toggleFilter("supervisionLevel", { value: "Low" });

      expect(presenter.countForCategory("ALL_TASKS")).toEqual(5);
      expect(presenter.countForCategory("OVERDUE")).toEqual(0);
      expect(presenter.countForCategory("DUE_THIS_WEEK")).toEqual(4);
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(1);
    });

    it("filters tasks by set filters", () => {
      presenter.setOnlyFilterForField("supervisionLevel", { value: "Low" });

      expect(presenter.countForCategory("ALL_TASKS")).toEqual(3);
      expect(presenter.countForCategory("OVERDUE")).toEqual(0);
      expect(presenter.countForCategory("DUE_THIS_WEEK")).toEqual(2);
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(1);
    });

    it("allTasksForCategory returns all tasks when applyFilter is false", () => {
      // First, no filters are set
      // allTasksForCategory should return the same number of tasks, regardless of applyFilter
      expect(presenter.allTasksForCategory("ALL_TASKS", true)).toHaveLength(5);
      expect(presenter.allTasksForCategory("ALL_TASKS", false)).toHaveLength(5);

      // Next, set filter
      presenter.setOnlyFilterForField("supervisionLevel", { value: "Low" });

      // allTasksForCategory should return a different number of tasks depending on applyFilter
      expect(presenter.allTasksForCategory("ALL_TASKS", true)).toHaveLength(3);
      expect(presenter.allTasksForCategory("ALL_TASKS", false)).toHaveLength(5);
    });

    it("logs filter changes", () => {
      presenter.unsetFilter("supervisionLevel", { value: "Low" });

      expect(
        mockAnalyticsStore.trackTaskFilterChanged,
      ).toHaveBeenLastCalledWith({
        changedFilterValue: "Low",
        changedFilterCategory: "supervisionLevel",
        changedFilterSelected: false,
        onlyClicked: false,
        selectedFilters: {},
      });

      presenter.unsetFilter("supervisionLevel", { value: "High" });

      expect(
        mockAnalyticsStore.trackTaskFilterChanged,
      ).toHaveBeenLastCalledWith({
        changedFilterValue: "High",
        changedFilterCategory: "supervisionLevel",
        changedFilterSelected: false,
        onlyClicked: false,
        selectedFilters: {},
      });

      presenter.setOnlyFilterForField("district", { value: "D31" });

      expect(
        mockAnalyticsStore.trackTaskFilterChanged,
      ).toHaveBeenLastCalledWith({
        changedFilterValue: "D31",
        changedFilterCategory: "district",
        changedFilterSelected: true,
        onlyClicked: true,
        selectedFilters: {
          district: ["D31"],
        },
      });
    });

    it("can filter on multiple values per field", () => {
      presenter.setOnlyFilterForField("supervisionLevel", { value: "Limited" });
      presenter.setFilter("supervisionLevel", { value: "Low" });

      expect(presenter.countForCategory("ALL_TASKS")).toEqual(4);
      expect(presenter.countForCategory("OVERDUE")).toEqual(0);
      expect(presenter.countForCategory("DUE_THIS_WEEK")).toEqual(3);
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(1);
    });

    it("can filter on multiple fields", () => {
      presenter.setOnlyFilterForField("supervisionLevel", { value: "Low" });
      presenter.setOnlyFilterForField("district", { value: "D10" });

      expect(presenter.countForCategory("ALL_TASKS")).toEqual(2);
      expect(presenter.countForCategory("OVERDUE")).toEqual(0);
      expect(presenter.countForCategory("DUE_THIS_WEEK")).toEqual(2);
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(0);
    });
  });

  describe("storing filter state", () => {
    beforeEach(() => {
      presenter = getPresenter({ workflowsStore: mockWorkflowsStore });
    });

    it("starts with no filters selected", () => {
      expect(presenter.selectedFilters).toEqual({});
    });

    it("stores multiple selected filters", () => {
      presenter.setOnlyFilterForField("supervisionLevel", { value: "Low" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "Low" }),
      ).toBeTrue();

      presenter.setFilter("supervisionLevel", { value: "High" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeTrue();
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "Low" }),
      ).toBeTrue();
    });

    it("setFilter() does not deselect selected filters", () => {
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeFalse();

      presenter.setFilter("supervisionLevel", { value: "High" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeTrue();

      presenter.unsetFilter("supervisionLevel", { value: "High" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeFalse();
    });

    it("resetting sets all filters", () => {
      presenter.setOnlyFilterForField("supervisionLevel", { value: "Low" });
      presenter.setFilter("supervisionLevel", { value: "High" });
      presenter.setOnlyFilterForField("caseType", { value: "general" });
      presenter.setOnlyFilterForField("displayName", { value: "Bob" });
      presenter.selectAllFilters();
      expect(presenter.selectedFilters).toEqual({
        district: ["D1", "D31", "D10", "D7"],
        supervisionLevel: ["Low", "Medium", "High", "Limited"],
        type: ["employment", "assessment", "homeVisit", "contact"],
      });

      expect(mockAnalyticsStore.trackTaskFiltersReset).toHaveBeenLastCalledWith(
        {
          selectedFiltersBeforeReset: {
            caseType: ["general"],
            displayName: ["Bob"],
            supervisionLevel: ["Low", "High"],
          },
        },
      );
    });

    it("clearing sets a cleared entry for all filter fields", () => {
      presenter.clearFilters();
      expect(presenter.selectedFilters).toEqual({
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
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeFalse();

      presenter.toggleFilter("supervisionLevel", { value: "High" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeTrue();
    });

    it("can toggle multiple filters", () => {
      presenter.toggleFilter("supervisionLevel", { value: "High" });
      presenter.toggleFilter("supervisionLevel", { value: "Low" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeTrue();
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "Low" }),
      ).toBeTrue();

      presenter.toggleFilter("supervisionLevel", { value: "High" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeFalse();
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "Low" }),
      ).toBeTrue();

      presenter.toggleFilter("district", { value: "District 10" });
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "High" }),
      ).toBeFalse();
      expect(
        presenter.filterIsSelected("supervisionLevel", { value: "Low" }),
      ).toBeTrue();
      expect(
        presenter.filterIsSelected("district", { value: "District 10" }),
      ).toBeTrue();
    });

    it("can track when all filters are selected", () => {
      // By default, no filters are selected
      expect(presenter.allFiltersSelected).toBeFalse();
      // Select high
      presenter.toggleFilter("supervisionLevel", { value: "High" });
      expect(presenter.allFiltersSelected).toBeFalse();
      // Select low
      presenter.toggleFilter("supervisionLevel", { value: "Low" });
      expect(presenter.allFiltersSelected).toBeFalse();
      // Deselect high
      presenter.toggleFilter("supervisionLevel", { value: "High" });
      expect(presenter.allFiltersSelected).toBeFalse();
      // Deselect low
      presenter.toggleFilter("supervisionLevel", { value: "Low" });
      expect(presenter.allFiltersSelected).toBeFalse();
      // Reselect all
      presenter.selectAllFilters();
      expect(presenter.allFiltersSelected).toBeTrue();
      // Deselect all
      presenter.clearFilters();
      expect(presenter.allFiltersSelected).toBeFalse();
    });
  });
});
