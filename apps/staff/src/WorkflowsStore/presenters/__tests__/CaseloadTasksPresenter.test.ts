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

import { SupervisionTaskCategory } from "../../../core/WorkflowsTasks/fixtures";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import TenantStore from "../../../RootStore/TenantStore";
import { JusticeInvolvedPerson } from "../../types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { CaseloadTasksPresenter } from "../CaseloadTasksPresenter";

let presenter: CaseloadTasksPresenter;

const NOW = new Date();

const mockAnalyticsStore = {
  trackTaskFilterSelected: vi.fn(),
} as any as AnalyticsStore;

const mockTenantStore = {
  taskCategories: ["assessment", "employment"],
} as any as TenantStore;

const mockWorkflowsStore = {
  caseloadPersons: [],
  selectedSearchIds: ["1", "2"],
} as any as WorkflowsStore;

function makePersonWithTasks(
  taskTypes: SupervisionTaskCategory[],
  { overdue = false, dateOffset = 0 } = {},
): JusticeInvolvedPerson {
  const tasks = taskTypes.map((type) => ({
    type,
    dueDate: addDays(NOW, dateOffset),
  }));
  return {
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
}): CaseloadTasksPresenter {
  return new CaseloadTasksPresenter(
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

    it("prepends 'DUE_THIS_MONTH' to categories supplied by the store for displaying categories", () => {
      expect(presenter.displayedTaskCategories).toEqual([
        "DUE_THIS_MONTH",
        ...mockTenantStore.taskCategories,
      ]);
    });
  });

  describe("selectedTaskCategory", () => {
    beforeEach(() => {
      presenter = getPresenter({});
    });

    it("is initialized to 'DUE_THIS_MONTH'", () => {
      expect(presenter.selectedCategory).toEqual("DUE_THIS_MONTH");
    });

    it("updates stored selected category when toggled", () => {
      presenter.toggleSelectedTaskCategory("employment");
      expect(presenter.selectedCategory).toEqual("employment");
    });

    it("toggles stored selected category when current category is reselected", () => {
      presenter.toggleSelectedTaskCategory("employment");
      presenter.toggleSelectedTaskCategory("employment");
      expect(presenter.selectedCategory).toEqual("DUE_THIS_MONTH");
    });

    it("logs category selection to the analytics store", () => {
      presenter.toggleSelectedTaskCategory("employment");
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
          makePersonWithTasks(["employment", "assessment"], { dateOffset: 1 }),
          makePersonWithTasks(["homeVisit"], { dateOffset: -1 }),
        ],
      } as any as WorkflowsStore;

      presenter = getPresenter({ workflowsStore });
    });

    it("filters by type in orderedTasksForCategory", () => {
      expect(presenter.orderedTasksForCategory("employment")).toHaveLength(2);
      expect(presenter.orderedTasksForCategory("contact")).toHaveLength(1);
      expect(presenter.orderedTasksForCategory("assessment")).toHaveLength(1);
      expect(presenter.orderedTasksForCategory("homeVisit")).toHaveLength(1);
      expect(presenter.orderedTasksForCategory("employmentNeed")).toHaveLength(
        0,
      );
    });

    it("uses stored category for orderedTasksForSelectedCategory", () => {
      presenter.toggleSelectedTaskCategory("employment");
      expect(presenter.orderedTasksForSelectedCategory).toHaveLength(2);
      presenter.toggleSelectedTaskCategory("assessment");
      expect(presenter.orderedTasksForSelectedCategory).toHaveLength(1);
    });

    it("are ordered by due date", () => {
      expect(
        presenter.orderedTasksForCategory("employment").map((t) => t.dueDate),
      ).toEqual([NOW, addDays(NOW, 1)]);
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

  describe("counting tasks", () => {
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

    it("counts all tasks for a category regardless of status", () => {
      expect(presenter.countForCategory("employment")).toEqual(2);
      expect(presenter.countForCategory("contact")).toEqual(1);
      expect(presenter.countForCategory("assessment")).toEqual(1);
      expect(presenter.countForCategory("homeVisit")).toEqual(1);
      expect(presenter.countForCategory("employmentNeed")).toEqual(0);
    });

    it("counts all people with tasks when given 'DUE_THIS_MONTH'", () => {
      expect(presenter.countForCategory("DUE_THIS_MONTH")).toEqual(3);
    });
  });
});