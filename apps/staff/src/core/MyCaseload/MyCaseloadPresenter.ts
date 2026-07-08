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

import { isThisMonth, isThisWeek } from "date-fns";
import { groupBy, uniq } from "lodash";
import { makeAutoObservable } from "mobx";

import { pluralizeWord } from "~utils";

import { FilterPresenter } from "../../FilterStore/FilterPresenter";
import TasksFilterStore from "../../FilterStore/TasksFilterStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import {
  Client,
  ClientTasksSummary,
  JusticeInvolvedPerson,
  TasksRowEntity,
  TaskTableItem,
  WorkflowsStore,
} from "../../WorkflowsStore";
import { taskDueDateComparator } from "../../WorkflowsStore/Task/TasksBase";
import {
  FilterField,
  FilterOption,
  FilterType,
  TaskFilterValue,
} from "../models/types";
import { SupervisionTaskCategory } from "../WorkflowsTasks/fixtures";
import {
  TasksTablePresenter,
  TaskTableColumnId,
} from "../WorkflowsTasks/TasksTable";

function sortPeopleByNextTaskDueDate(
  personA: JusticeInvolvedPerson,
  personB: JusticeInvolvedPerson,
): number {
  if (
    !personA.supervisionTasks?.orderedTasks[0] ||
    !personB.supervisionTasks?.orderedTasks[0]
  )
    return 0;
  return (
    +personA.supervisionTasks.orderedTasks[0].dueDate -
    +personB.supervisionTasks.orderedTasks[0].dueDate
  );
}

/**
 * Presenter for the My Caseload view (US_MO `usMoMyCaseload` feature variant).
 *
 * Unlike the legacy Tasks page (`CaseloadTasksPresenterV2`), My Caseload is
 * always a one-row-per-client view whose "All Clients" tab shows the *entire*
 * filtered caseload — including clients with no tasks — and caps surfaced tasks
 * at the current month. It owns its own task bucketing (the week/month split is
 * always active because My Caseload always renders both tabs) rather than
 * keying off the tenant's Tasks-page configuration. It backs the shared
 * `TasksTable` (via `TasksTablePresenter`) and `WorkflowsFilterDropdown` (via
 * `FilterPresenter`).
 */
export class MyCaseloadPresenter
  implements TasksTablePresenter, FilterPresenter<TasksFilterStore>
{
  private _selectedCategory: SupervisionTaskCategory = "ALL_TASKS";

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    public readonly filterStore: TasksFilterStore,
    protected analyticsStore: AnalyticsStore,
  ) {
    makeAutoObservable(this);
  }

  get selectedTaskCategory(): SupervisionTaskCategory {
    return this._selectedCategory;
  }

  set selectedTaskCategory(newCategory: SupervisionTaskCategory) {
    this.analyticsStore.trackTaskTableCategorySelected({
      selectedCategory: newCategory,
      previousCategory: this._selectedCategory,
      newTabRowCount: this.personsCountForCategory(newCategory),
      selectedCaseloadIds: this.workflowsStore.searchStore.selectedSearchIds,
    });

    this._selectedCategory = newCategory;
  }

  // My Caseload is always a one-row-per-client view.
  get showOneRowPerClient(): boolean {
    return true;
  }

  // Selection controls
  selectPerson(person: JusticeInvolvedPerson) {
    this.workflowsStore.updateSelectedPerson(person.pseudonymizedId);
  }

  shouldHighlightRow({ person }: TasksRowEntity): boolean {
    return (
      person.pseudonymizedId ===
      this.workflowsStore.selectedPerson?.pseudonymizedId
    );
  }

  get displayIdHeader() {
    return this.tenantStore.getDisplayIdCopy("SUPERVISION");
  }

  get tasksTableColumns(): TaskTableColumnId[] {
    // My Caseload's own column set: a rolled-up "tasks" column (first task +
    // "+n more") instead of the per-task task/dueDate/frequency/tasksDue
    // columns the legacy Tasks page renders. Owned here rather than in the
    // shared `tenantStore.tasksTableColumns` so the Tasks route is unaffected.
    // The "tasks" cell formatter lives in TasksTable.tsx:getColumnDefs.
    return ["name", "id", "supervisionLevel", "caseType", "tasks"];
  }

  get emptyTabText(): string | undefined {
    // My Caseload renders its own empty state (`MyCaseloadEmptyTab` via
    // `TasksTable`'s `renderEmptyState`), so this is not shown in practice; it
    // exists to satisfy `TasksTablePresenter` and mirrors the Tasks-page copy.
    const caseloadTerm = pluralizeWord({
      term: "caseload",
      count: this.workflowsStore.searchStore.selectedSearchables.length,
    });

    switch (this.selectedTaskCategory) {
      case "ALL_TASKS":
        return `There are no contacts or assessments currently overdue or due within the next month for the selected ${caseloadTerm}.`;
      case "DUE_THIS_MONTH":
        return `There are no contacts or assessments currently due within the next month for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      case "DUE_THIS_WEEK":
        return `There are no contacts or assessments due within the next week for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      case "OVERDUE":
        return `There are no overdue contacts or assessments for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      default:
        return undefined;
    }
  }

  // FilterPresenter surface (WorkflowsFilterDropdown)

  trackFilterDropdownOpened() {
    return this.filterStore.trackTaskFilterDropdownOpened;
  }

  // Distinct clients matching the option within the *selected* tab, regardless
  // of the currently selected filters. The count is tab-specific (e.g. on
  // "Overdue" it reflects clients with an overdue matching task) so it lines up
  // with the rows that tab surfaces, and counts clients — not tasks — because
  // My Caseload is one-row-per-client. Backed by a memoized single-pass map so
  // this is an O(1) lookup rather than a caseload scan per option.
  numItems(type: FilterType, field: FilterField, option: FilterOption): number {
    return (
      this.optionCountsByField.get(`${type}:${field}`)?.get(option.value) ?? 0
    );
  }

  /**
   * Distinct-client counts for every filter option in the selected tab, built in
   * a single pass and memoized (a `computed` via `makeAutoObservable`), keyed
   * `${type}:${field}` -> option value -> count.
   *
   * "All Clients" lists every client (including task-less ones), so person-typed
   * options count distinct clients across the whole caseload; deriving them from
   * tasks would drop task-less clients (making, e.g., a Case Type read 0 while
   * such clients are clearly listed). Task-typed options — and every other tab —
   * count distinct clients with a matching task in the bucket, since a task-less
   * client can't match a task filter anyway.
   */
  private get optionCountsByField(): Map<string, Map<TaskFilterValue, number>> {
    const counts = new Map<string, Map<TaskFilterValue, number>>();
    const seenClientsByKey = new Map<string, Set<string>>();

    const addDistinctClient = (
      key: string,
      value: TaskFilterValue,
      clientId: string,
    ) => {
      let seen = seenClientsByKey.get(key);
      if (!seen) {
        seen = new Set();
        seenClientsByKey.set(key, seen);
      }
      const dedupeKey = `${String(value)}::${clientId}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      let valueCounts = counts.get(key);
      if (!valueCounts) {
        valueCounts = new Map();
        counts.set(key, valueCounts);
      }
      valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1);
    };

    const isAllClients = this.selectedTaskCategory === "ALL_TASKS";
    const sections = this.filterStore.filters;

    // "All Clients": person-typed options count every client, tasks or not.
    if (isAllClients) {
      for (const person of this.workflowsStore.caseloadPersons) {
        for (const section of sections) {
          if (section.type !== "person") continue;
          // @ts-expect-error searchable fields are restricted to strings but TS does not know that
          const value = person[section.field];
          addDistinctClient(
            `person:${section.field}`,
            value,
            person.pseudonymizedId,
          );
        }
      }
    }

    // Task-typed options (always), plus person-typed options on the other tabs:
    // count distinct clients with a matching task in the bucket.
    for (const task of this.filterStore.allTasksForCategory(
      "ALL_TASKS",
      false,
    )) {
      if (!this.taskIsInCategory(task, this.selectedTaskCategory)) continue;
      for (const section of sections) {
        if (section.type === "task") {
          // @ts-expect-error searchable fields are restricted to strings but TS does not know that
          const value = task[section.field];
          addDistinctClient(
            `task:${section.field}`,
            value,
            task.person.pseudonymizedId,
          );
        } else if (section.type === "person" && !isAllClients) {
          // @ts-expect-error searchable fields are restricted to strings but TS does not know that
          const value = task.person[section.field];
          addDistinctClient(
            `person:${section.field}`,
            value,
            task.person.pseudonymizedId,
          );
        }
      }
    }

    return counts;
  }

  // Task bucketing — owned here rather than in the shared filter store.

  // All tasks for the filtered caseload, unbucketed (person + task filters
  // applied by the store).
  private get filteredTasks(): TaskTableItem[] {
    return this.filterStore.allTasksForCategory("ALL_TASKS", true);
  }

  /**
   * Whether a task belongs in a My Caseload tab. "All Clients" is the full
   * current-month horizon (overdue + this week + this month, nothing due next
   * month or later). The week/month split is always applied because My Caseload
   * always renders both a "Due this week" and a "Due this month" tab, so the
   * buckets are mutually exclusive.
   */
  private taskIsInCategory(
    t: TaskTableItem,
    category: SupervisionTaskCategory,
  ): boolean {
    switch (category) {
      case "ALL_TASKS":
        return t.isOverdue || isThisWeek(t.dueDate) || isThisMonth(t.dueDate);
      case "OVERDUE":
        return t.isOverdue;
      case "DUE_THIS_WEEK":
        return !t.isOverdue && isThisWeek(t.dueDate);
      case "DUE_THIS_MONTH":
        return !t.isOverdue && !isThisWeek(t.dueDate) && isThisMonth(t.dueDate);
      default:
        return false;
    }
  }

  /** Tasks for a My Caseload tab, ordered by due date. */
  private bucketedTasks(category: SupervisionTaskCategory): TaskTableItem[] {
    return this.filteredTasks
      .filter((t) => this.taskIsInCategory(t, category))
      .sort(taskDueDateComparator);
  }

  /**
   * Every client in the filtered caseload — including those with no tasks.
   * When a task filter is active, only clients with a matching task qualify, so
   * the store's `filteredPeople` is exactly right. With no task filter, a client
   * with zero tasks still belongs in "All Clients", so derive the list from the
   * person filters directly (the store's `filteredPeople` drops task-less
   * clients).
   */
  private get allClients(): JusticeInvolvedPerson[] {
    const taskFilters = this.filterStore.selectedFiltersForType("task");
    if (Object.keys(taskFilters).length > 0) {
      return this.filterStore.filteredPeople;
    }

    const personFilters = Object.entries(
      this.filterStore.selectedFiltersForType("person"),
    );
    return this.workflowsStore.caseloadPersons.filter((person) =>
      personFilters.every(([field, options]) =>
        // @ts-expect-error searchable fields are restricted to strings but TS does not know that
        options.includes(person[field]),
      ),
    );
  }

  personsCountForCategory(category: SupervisionTaskCategory): number {
    // "All Clients" counts the whole filtered caseload; the other tabs count
    // clients with a matching task in that bucket.
    if (category === "ALL_TASKS") {
      return this.allClients.length;
    }
    return uniq(this.bucketedTasks(category).map((t) => t.person)).length;
  }

  get rowEntitiesForSelectedCategory(): TasksRowEntity[] {
    return this.orderedClientsWithTaskSummaries;
  }

  get orderedClientsWithTaskSummaries(): ClientTasksSummary[] {
    if (this.selectedTaskCategory === "ALL_TASKS") {
      // Every client, even those with no tasks — build rows from the caseload,
      // not the tasks, attaching each client's current-month task summary.
      const tasksByClientId = groupBy(
        this.bucketedTasks("ALL_TASKS"),
        (task) => task.person.pseudonymizedId,
      );
      return [...this.allClients]
        .sort(sortPeopleByNextTaskDueDate)
        .map((person) => ({
          person: person as Client,
          tasks: tasksByClientId[person.pseudonymizedId] ?? [],
        }));
    }

    // Other tabs: one row per client that has a task in the bucket.
    const tasksByClient = groupBy(
      this.bucketedTasks(this.selectedTaskCategory),
      (task) => task.person.pseudonymizedId,
    );
    return Object.values(tasksByClient).map((clientTasks) => ({
      person: clientTasks[0].person,
      tasks: clientTasks,
    }));
  }
}
