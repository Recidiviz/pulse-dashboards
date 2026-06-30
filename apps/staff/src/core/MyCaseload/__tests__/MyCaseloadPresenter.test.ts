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

import { addDays, differenceInCalendarMonths } from "date-fns";
import tk from "timekeeper";

import TasksFilterStore from "../../../FilterStore/TasksFilterStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import TenantStore from "../../../RootStore/TenantStore";
import {
  ClientTasksSummary,
  JusticeInvolvedPerson,
  WorkflowsStore,
} from "../../../WorkflowsStore";
import { MyCaseloadPresenter } from "../MyCaseloadPresenter";

let presenter: MyCaseloadPresenter;

// Freeze time so that tests using isThisWeek() and isThisMonth() are not flakey.
const now = new Date(2022, 1, 3);
tk.freeze(now);

const mockAnalyticsStore = {
  trackTaskTableCategorySelected: vi.fn(),
  trackTaskFilterChanged: vi.fn(),
  trackTaskFiltersReset: vi.fn(),
  trackTaskFiltersCleared: vi.fn(),
} as any as AnalyticsStore;

const mockTenantStore = {
  taskCategories: ["ALL_TASKS", "OVERDUE", "DUE_THIS_WEEK", "DUE_THIS_MONTH"],
  tasksConfiguration: {
    tasks: {
      assessment: { constructor: vi.fn() },
      contact: { constructor: vi.fn() },
    },
    filters: [
      {
        field: "supervisionLevel",
        type: "person",
        options: [{ value: "Low" }, { value: "Medium" }, { value: "High" }],
      },
      {
        field: "type",
        type: "task",
        options: [{ value: "assessment" }, { value: "contact" }],
      },
    ],
  },
} as any as TenantStore;

const mockRootStore = {
  userStore: { activeFeatureVariants: {} },
};

const mockWorkflowsStore = {
  caseloadPersons: [],
  searchStore: { selectedSearchIds: ["1", "2"], selectedSearchables: [{}] },
  rootStore: mockRootStore,
} as any as WorkflowsStore;

function makePersonWithTasks(
  taskTypes: string[],
  {
    overdue = false,
    dateOffset = 0,
    supervisionLevel = "Low",
    id = undefined as string | undefined,
  } = {},
): JusticeInvolvedPerson {
  // Lightweight person stub carrying just the fields the row/count builders
  // read (`task.person.pseudonymizedId`, `task.person.supervisionLevel`).
  // Intentionally NOT the full person object — a back-reference would create a
  // cycle that mobx can't observe. Shared across the client's tasks so it is a
  // single reference, as it is in production (where `uniq(...map(t => t.person))`
  // dedupes by reference).
  const personStub = { pseudonymizedId: id, supervisionLevel };
  const tasks = taskTypes.map((type) => ({
    type,
    dueDate: addDays(new Date(), dateOffset),
    isOverdue: overdue,
    person: personStub,
  }));
  return {
    supervisionLevel,
    pseudonymizedId: id,
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
}: {
  workflowsStore?: WorkflowsStore;
  tenantStore?: TenantStore;
  analyticsStore?: AnalyticsStore;
} = {}): MyCaseloadPresenter {
  const filterStore = new TasksFilterStore(
    analyticsStore,
    tenantStore,
    workflowsStore,
  );
  return new MyCaseloadPresenter(
    workflowsStore,
    tenantStore,
    filterStore,
    analyticsStore,
  );
}

// a: due this week, b: due this month, c: due next month, d: no tasks at all
function caseloadWithVariedTasks(): WorkflowsStore {
  return {
    ...mockWorkflowsStore,
    caseloadPersons: [
      makePersonWithTasks(["contact"], { id: "a", dateOffset: 2 }),
      makePersonWithTasks(["assessment"], { id: "b", dateOffset: 15 }),
      makePersonWithTasks(["assessment"], { id: "c", dateOffset: 35 }),
      makePersonWithTasks([], { id: "d" }),
    ],
  } as any as WorkflowsStore;
}

describe("MyCaseloadPresenter", () => {
  it("is always a one-row-per-client view", () => {
    expect(getPresenter().showOneRowPerClient).toBeTrue();
  });

  it("uses its own rolled-up column set, independent of the tenant Tasks config", () => {
    expect(getPresenter().tasksTableColumns).toEqual([
      "name",
      "id",
      "supervisionLevel",
      "caseType",
      "tasks",
    ]);
  });

  it("'All Clients' shows one row per client for the full caseload, including a client with no tasks", () => {
    presenter = getPresenter({ workflowsStore: caseloadWithVariedTasks() });
    presenter.selectedTaskCategory = "ALL_TASKS";

    const rows = presenter.rowEntitiesForSelectedCategory;
    expect(rows).toHaveLength(4);

    // The zero-task client (d) is present, with an empty task summary.
    const rowD = rows.find(
      (r) => r.person.pseudonymizedId === "d",
    ) as ClientTasksSummary;
    expect(rowD).toBeDefined();
    expect(rowD.tasks).toHaveLength(0);
  });

  it("'All Clients' badge counts the whole caseload, not just task-bearing clients", () => {
    presenter = getPresenter({ workflowsStore: caseloadWithVariedTasks() });
    expect(presenter.personsCountForCategory("ALL_TASKS")).toEqual(4);
  });

  it("does not surface next-month tasks in 'All Clients' or 'Due this month'", () => {
    presenter = getPresenter({ workflowsStore: caseloadWithVariedTasks() });

    presenter.selectedTaskCategory = "ALL_TASKS";
    const allClientTasks = (
      presenter.rowEntitiesForSelectedCategory as ClientTasksSummary[]
    ).flatMap((r) => r.tasks);
    expect(
      allClientTasks.some(
        (t) => differenceInCalendarMonths(t.dueDate, new Date()) === 1,
      ),
    ).toBeFalse();

    // Client c (next-month task) still renders, but with no summarized tasks.
    const rowC = (
      presenter.rowEntitiesForSelectedCategory as ClientTasksSummary[]
    ).find((r) => r.person.pseudonymizedId === "c");
    expect(rowC?.tasks).toHaveLength(0);

    presenter.selectedTaskCategory = "DUE_THIS_MONTH";
    expect(presenter.personsCountForCategory("DUE_THIS_MONTH")).toEqual(1);
  });

  it("splits week/month into mutually exclusive buckets regardless of tenant config", () => {
    // Tenant config omits DUE_THIS_WEEK entirely; the presenter still splits
    // because My Caseload always renders both tabs.
    const tenantWithoutThisWeek = {
      ...mockTenantStore,
      taskCategories: ["DUE_THIS_MONTH", "DUE_NEXT_MONTH", "OVERDUE"],
    } as any as TenantStore;

    presenter = getPresenter({
      tenantStore: tenantWithoutThisWeek,
      workflowsStore: {
        ...mockWorkflowsStore,
        caseloadPersons: [
          makePersonWithTasks(["contact"], { id: "a", dateOffset: 2 }), // this week
          makePersonWithTasks(["assessment"], { id: "b", dateOffset: 15 }), // this month, not this week
        ],
      } as any as WorkflowsStore,
    });

    expect(presenter.personsCountForCategory("DUE_THIS_WEEK")).toEqual(1);
    expect(presenter.personsCountForCategory("DUE_THIS_MONTH")).toEqual(1);
  });

  it("narrows 'All Clients' by the active person filter", () => {
    presenter = getPresenter({
      workflowsStore: {
        ...mockWorkflowsStore,
        caseloadPersons: [
          makePersonWithTasks([], { id: "low", supervisionLevel: "Low" }),
          makePersonWithTasks([], { id: "high", supervisionLevel: "High" }),
        ],
      } as any as WorkflowsStore,
    });

    presenter.filterStore.setFilter(
      "supervisionLevel" as any,
      { value: "High" } as any,
    );

    const rows = presenter.rowEntitiesForSelectedCategory;
    expect(rows).toHaveLength(1);
    expect(rows[0].person.pseudonymizedId).toEqual("high");
  });

  it("drops zero-task and non-matching clients from 'All Clients' when a task filter is active", () => {
    presenter = getPresenter({ workflowsStore: caseloadWithVariedTasks() });

    presenter.filterStore.setFilter(
      "type" as any,
      { value: "assessment" } as any,
    );

    // With a task filter active, "All Clients" falls back to the matching
    // caseload: the assessment clients b and c qualify, while the contact-only
    // client a and the zero-task client d are dropped (down from 4).
    expect(presenter.personsCountForCategory("ALL_TASKS")).toEqual(2);
    const rows = presenter.rowEntitiesForSelectedCategory;
    const ids = rows.map((r) => r.person.pseudonymizedId);
    expect(ids).toContain("b");
    expect(ids).not.toContain("a");
    expect(ids).not.toContain("d");

    // c's only assessment is next month, so it appears but with an empty
    // (horizon-capped) summary.
    const rowC = (rows as ClientTasksSummary[]).find(
      (r) => r.person.pseudonymizedId === "c",
    );
    expect(rowC?.tasks).toHaveLength(0);
  });

  describe("numItems (filter option counts)", () => {
    it("counts distinct clients, not tasks, for a task-type option", () => {
      // Client a has two matching contact tasks; client b has one. The count is
      // 2 clients, not 3 tasks (My Caseload is one-row-per-client).
      presenter = getPresenter({
        workflowsStore: {
          ...mockWorkflowsStore,
          caseloadPersons: [
            makePersonWithTasks(["contact", "contact"], { id: "a" }),
            makePersonWithTasks(["contact"], { id: "b" }),
            makePersonWithTasks(["assessment"], { id: "c" }),
          ],
        } as any as WorkflowsStore,
      });

      expect(
        presenter.numItems("task", "type" as any, { value: "contact" } as any),
      ).toEqual(2);
      expect(
        presenter.numItems(
          "task",
          "type" as any,
          {
            value: "assessment",
          } as any,
        ),
      ).toEqual(1);
    });

    it("counts distinct clients for a person-type option", () => {
      // Client a has two tasks but is one High client; b is the other.
      presenter = getPresenter({
        workflowsStore: {
          ...mockWorkflowsStore,
          caseloadPersons: [
            makePersonWithTasks(["contact", "assessment"], {
              id: "a",
              supervisionLevel: "High",
            }),
            makePersonWithTasks(["contact"], {
              id: "b",
              supervisionLevel: "High",
            }),
            makePersonWithTasks(["contact"], {
              id: "c",
              supervisionLevel: "Low",
            }),
          ],
        } as any as WorkflowsStore,
      });

      expect(
        presenter.numItems(
          "person",
          "supervisionLevel" as any,
          {
            value: "High",
          } as any,
        ),
      ).toEqual(2);
    });

    it("counts only clients whose matching task falls in the selected tab", () => {
      // Four clients, each with one contact task in a different bucket.
      presenter = getPresenter({
        workflowsStore: {
          ...mockWorkflowsStore,
          caseloadPersons: [
            makePersonWithTasks(["contact"], { id: "od", overdue: true }),
            makePersonWithTasks(["contact"], { id: "tw", dateOffset: 2 }), // this week
            makePersonWithTasks(["contact"], { id: "tm", dateOffset: 15 }), // this month
            makePersonWithTasks(["contact"], { id: "nm", dateOffset: 35 }), // next month
          ],
        } as any as WorkflowsStore,
      });

      const contactCount = () =>
        presenter.numItems("task", "type" as any, { value: "contact" } as any);

      // "All Clients" is the current-month horizon, so the next-month client is
      // excluded (3, not 4).
      presenter.selectedTaskCategory = "ALL_TASKS";
      expect(contactCount()).toEqual(3);

      presenter.selectedTaskCategory = "OVERDUE";
      expect(contactCount()).toEqual(1);

      presenter.selectedTaskCategory = "DUE_THIS_WEEK";
      expect(contactCount()).toEqual(1);

      presenter.selectedTaskCategory = "DUE_THIS_MONTH";
      expect(contactCount()).toEqual(1);
    });
  });
});
