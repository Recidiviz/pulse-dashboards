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

import { differenceInCalendarMonths, isThisMonth, isThisWeek } from "date-fns";
import { uniq } from "lodash";
import { makeObservable } from "mobx";

import {
  FilterField,
  FilterOption,
  WorkflowsTasksConfig,
} from "../core/models/types";
import { SupervisionTaskCategory } from "../core/WorkflowsTasks/fixtures";
import AnalyticsStore from "../RootStore/AnalyticsStore";
import TenantStore from "../RootStore/TenantStore";
import { JusticeInvolvedPerson } from "../WorkflowsStore";
import { WorkflowsStore } from "../WorkflowsStore";
import { Client } from "../WorkflowsStore/Client";
import { taskDueDateComparator } from "../WorkflowsStore/Task/TasksBase";
import { TaskTableItem } from "../WorkflowsStore/Task/types";
import FilterStoreBase from "./FilterStoreBase";

export default class TasksFilterStore extends FilterStoreBase {
  constructor(
    protected readonly analyticsStore: AnalyticsStore,
    readonly tenantStore: TenantStore,
    protected readonly workflowsStore: WorkflowsStore,
  ) {
    super();
    makeObservable<TasksFilterStore>(this, {
      // Observables
      _selectedFilters: true,

      // Computed
      filterConfig: false,
      filters: false,
      filteredPeople: false,
      displayedTaskCategories: false,

      // Actions
      clearFilters: true,
      taskMatchesFilters: true,
      orderedTasksForCategory: true,
      orderedPersonsForCategory: true,
      orderedTasksForSelectedCategory: true,
      countForSupervisionTaskCategory: true,
      allTasksForCategory: true,
      personMatchesFilters: true,
      trackTaskFilterDropdownOpened: true,
      trackFiltersReset: true,
      trackFilterChanged: true,
    });
  }

  get filters() {
    // TODO(#10615): Remove filter condition when UsIdTasksV2 is fully rolled out.
    return super.filters.filter(({ title }) => {
      // Special case: hide "Task Type" filter for US_ID without v2 flag
      if (title === "Task Type" && this.workflowsStore.isUsIdLegacyTasksEnabled)
        return false;
      return true;
    });
  }

  get filterConfig(): WorkflowsTasksConfig {
    const { tasksConfiguration } = this.tenantStore;

    return tasksConfiguration || ({} as WorkflowsTasksConfig);
  }

  clearFilters = () => {
    this._selectedFilters = {};

    this.analyticsStore.trackTaskFiltersCleared();
  };

  // Tasks Specific Filters

  taskMatchesFilters(task: TaskTableItem): boolean {
    const filtersForType = Object.entries(this.selectedFiltersForType("task"));

    return filtersForType.every(([field, options]) =>
      // @ts-expect-error searchable fields are restricted to strings but TS does not know that
      options.includes(task[field]),
    );
  }

  orderedTasksForCategory(category: SupervisionTaskCategory): TaskTableItem[] {
    return this.allTasksForCategory(category, true).sort(taskDueDateComparator);
  }

  orderedPersonsForCategory(
    category: SupervisionTaskCategory,
  ): JusticeInvolvedPerson[] {
    return uniq(this.orderedTasksForCategory(category).map((t) => t.person));
  }

  orderedTasksForSelectedCategory(
    selectedCategory: SupervisionTaskCategory,
  ): TaskTableItem[] {
    return this.orderedTasksForCategory(selectedCategory);
  }

  countForSupervisionTaskCategory(category: SupervisionTaskCategory): number {
    return this.orderedTasksForCategory(category).length;
  }

  /**
   * Tasks for a given person that may participate in the dashboard table.
   * Merges in the client's user-authored custom tasks when the
   * `customTasks` feature variant is on. When the flag is off, this is
   * byte-identical to reading `person.supervisionTasks.readyOrderedTasks`
   * — `Client.customTasks` is only constructed under the flag
   * ([Client.ts](../WorkflowsStore/Client.ts)), but we still gate
   * explicitly so the merge intent is legible at this call site.
   */
  private candidateTasksForPerson(
    person: JusticeInvolvedPerson,
    category: SupervisionTaskCategory,
  ): TaskTableItem[] {
    const { supervisionTasks } = person;
    let supervisionList: TaskTableItem[] = [];
    if (supervisionTasks) {
      supervisionList =
        category === "HIDDEN"
          ? supervisionTasks.orderedTasks
          : supervisionTasks.readyOrderedTasks;
    }

    const customFlagOn =
      !!this.workflowsStore.rootStore.userStore.activeFeatureVariants
        .customTasks;
    const customList: TaskTableItem[] =
      customFlagOn && person instanceof Client && person.customTasks
        ? person.customTasks.activeTaskItems
        : [];

    return [...supervisionList, ...customList];
  }

  allTasksForCategory(
    category: SupervisionTaskCategory,
    applyFilter = true,
  ): TaskTableItem[] {
    // If applyFilter is true, only return tasks for people that match the currently selected filters
    // If applyFilter is false, return tasks for all people (regardless of filters)
    const people = applyFilter
      ? this.filteredPeople
      : this.workflowsStore.caseloadPersons;

    return people.flatMap((person) => {
      const candidates = this.candidateTasksForPerson(person, category);
      if (!candidates.length) return [];

      if (category === "HIDDEN") {
        // Custom tasks have no snooze concept (`isSnoozed` is always
        // false on `CustomTaskItem`), so they're naturally excluded
        // here — matching how supervision tasks' HIDDEN tab is the
        // snooze bin.
        return candidates.filter(
          (t) => (this.taskMatchesFilters(t) || !applyFilter) && t.isSnoozed,
        );
      }

      const hasThisWeekTab =
        this.displayedTaskCategories.includes("DUE_THIS_WEEK");

      return candidates.filter((t) => {
        if (applyFilter && !this.taskMatchesFilters(t)) return false;

        switch (category) {
          case "ALL_TASKS":
            return true;
          case "OVERDUE":
            return t.isOverdue;
          case "DUE_THIS_WEEK":
            return !t.isOverdue && isThisWeek(t.dueDate);
          case "DUE_THIS_MONTH":
            return (
              !t.isOverdue &&
              !(hasThisWeekTab && isThisWeek(t.dueDate)) &&
              isThisMonth(t.dueDate)
            );
          case "DUE_NEXT_MONTH":
            return differenceInCalendarMonths(t.dueDate, new Date()) === 1;
          default:
            return false;
        }
      });
    });
  }

  get filteredPeople(): JusticeInvolvedPerson[] {
    return this.workflowsStore.caseloadPersons.filter((p) =>
      this.personMatchesFilters(p),
    );
  }

  personMatchesFilters(person: JusticeInvolvedPerson): boolean {
    const filters = Object.entries(this.selectedFiltersForType("person"));

    const matchesPeopleFilters = filters.every(([field, options]) =>
      // @ts-expect-error searchable fields are restricted to strings but TS does not know that
      options.includes(person[field]),
    );

    if (!matchesPeopleFilters) return false;

    // Person passes if ANY of their tasks (supervision or, under the
    // `customTasks` flag, custom) match the active task-typed filters.
    // Custom tasks are pulled in by `candidateTasksForPerson`, which is
    // already feature-flag-gated; here we just use `ALL_TASKS` to opt
    // out of category bucketing so a client with only a custom task
    // still surfaces as a candidate.
    const candidates = this.candidateTasksForPerson(person, "ALL_TASKS");
    return candidates.some((task) => this.taskMatchesFilters(task));
  }

  // Tab categories used in the new tasks view
  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return this.tenantStore.taskCategories;
  }

  trackTaskFilterDropdownOpened() {
    this.analyticsStore.trackTaskFilterDropdownOpened();
  }

  trackFiltersReset = () => {
    this.analyticsStore.trackTaskFiltersReset({
      selectedFiltersBeforeReset: this._selectedFilters,
    });
  };

  trackFilterChanged = (
    field: FilterField,
    option: FilterOption,
    changedFilterSelected?: boolean,
    onlyClicked?: boolean,
  ) => {
    this.analyticsStore.trackTaskFilterChanged({
      changedFilterCategory: field,
      changedFilterValue: option.value,
      changedFilterSelected: !!changedFilterSelected,
      selectedFilters: this._selectedFilters,
      onlyClicked: !!onlyClicked,
    });
  };
}
