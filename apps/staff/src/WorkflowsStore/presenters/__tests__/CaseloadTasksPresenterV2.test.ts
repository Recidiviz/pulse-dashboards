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
  },
} as any as TenantStore;

const mockWorkflowsStore = {
  caseloadPersons: [],
  searchStore: { selectedSearchIds: ["1", "2"] },
} as any as WorkflowsStore;

function makePersonWithTasks(
  taskTypes: SupervisionTaskCategory[],
  { overdue = false, dateOffset = 0, supervisionLevel = "Low" } = {},
): JusticeInvolvedPerson {
  const tasks = taskTypes.map((type) => ({
    type,
    dueDate: addDays(new Date(), dateOffset),
    isOverdue: overdue,
  }));
  return {
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
  );
}

describe("CaseloadTasksPresenter", () => {
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

    it("is initialized to 'ALL_TASKS'", () => {
      expect(presenter.selectedCategory).toEqual("ALL_TASKS");
    });

    it("updates stored selected category when changes", () => {
      presenter.selectedTaskCategory = "employment";
      expect(presenter.selectedCategory).toEqual("employment");
    });

    it("keeps the same category when selected twice", () => {
      presenter.selectedTaskCategory = "employment";
      presenter.selectedTaskCategory = "employment";
      expect(presenter.selectedCategory).toEqual("employment");
    });

    it("logs category selection to the analytics store", () => {
      presenter.selectedTaskCategory = "employment";
      expect(
        mockAnalyticsStore.trackTaskFilterSelected,
      ).toHaveBeenLastCalledWith({
        selectedSearchIds: ["1", "2"],
        taskCategory: "employment",
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
  });

  describe("filtering people", () => {
    beforeEach(() => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        caseloadPersons: [
          makePersonWithTasks(["employment", "contact"], {
            supervisionLevel: "Low",
          }),
          makePersonWithTasks(["contact"], {
            supervisionLevel: "Low",
            dateOffset: 7,
          }),
          makePersonWithTasks(["contact"], {
            supervisionLevel: "Medium",
          }),
          makePersonWithTasks(["employment"], {
            supervisionLevel: "Medium",
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

    it("filters tasks by set filters", () => {
      presenter.setFilter("supervisionLevel", { value: "Low" });

      expect(presenter.countForCategory("ALL_TASKS")).toEqual(3);
      expect(presenter.countForCategory("OVERDUE")).toEqual(0);
      expect(presenter.countForCategory("DUE_THIS_WEEK")).toEqual(2);
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(1);
    });
  });

  describe("storing filter state", () => {
    beforeEach(() => {
      presenter = getPresenter({ workflowsStore: mockWorkflowsStore });
    });

    it("starts with no filters selected", () => {
      expect(presenter.selectedFilters).toEqual({});
    });

    it("stores selected filters", () => {
      presenter.setFilter("supervisionLevel", { value: "Low" });
      expect(presenter.selectedFilters).toEqual({
        supervisionLevel: { value: "Low" },
      });

      presenter.setFilter("supervisionLevel", { value: "High" });
      expect(presenter.selectedFilters).toEqual({
        supervisionLevel: { value: "High" },
      });
    });

    it("clears filters", () => {
      presenter.setFilter("supervisionLevel", { value: "Low" });
      presenter.resetFilters();
      expect(presenter.selectedFilters).toEqual({});
    });
  });
});
