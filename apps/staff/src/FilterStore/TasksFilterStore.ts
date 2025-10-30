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
import { taskDueDateComparator } from "../WorkflowsStore/Task/TasksBase";
import { SupervisionTask } from "../WorkflowsStore/Task/types";
import FilterStoreBase from "./FilterStoreBase";

export default class TasksFilterStore extends FilterStoreBase {
  constructor(
    protected readonly analyticsStore: AnalyticsStore,
    readonly tenantStore: TenantStore,
    protected readonly workflowsStore: WorkflowsStore,
  ) {
    super(analyticsStore, tenantStore, workflowsStore);
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

  get filterConfig(): WorkflowsTasksConfig {
    const { tasksConfiguration, currentTenantId } = this.tenantStore;

    if (!tasksConfiguration) {
      throw new Error(
        `Trying to initialize TasksFilterStore for state without task configuration: ${currentTenantId}`,
      );
    }
    return tasksConfiguration as WorkflowsTasksConfig;
  }

  clearFilters = () => {
    this._selectedFilters = {};

    this.analyticsStore.trackTaskFiltersCleared();
  };

  // Tasks Specific Filters

  taskMatchesFilters(task: SupervisionTask): boolean {
    const filtersForType = Object.entries(this.selectedFiltersForType("task"));

    return filtersForType.every(([field, options]) =>
      // @ts-expect-error searchable fields are restricted to strings but TS does not know that
      options.includes(task[field]),
    );
  }

  orderedTasksForCategory(
    category: SupervisionTaskCategory,
  ): SupervisionTask[] {
    return this.allTasksForCategory(category, true).sort(taskDueDateComparator);
  }

  orderedPersonsForCategory(
    category: SupervisionTaskCategory,
  ): JusticeInvolvedPerson[] {
    return uniq(this.orderedTasksForCategory(category).map((t) => t.person));
  }

  orderedTasksForSelectedCategory(
    selectedCategory: SupervisionTaskCategory,
  ): SupervisionTask[] {
    return this.orderedTasksForCategory(selectedCategory);
  }

  countForSupervisionTaskCategory(category: SupervisionTaskCategory): number {
    return this.orderedTasksForCategory(category).length;
  }

  allTasksForCategory(
    category: SupervisionTaskCategory,
    applyFilter = true,
  ): SupervisionTask[] {
    // If applyFilter is true, only return tasks for people that match the currently selected filters
    // If applyFilter is false, return tasks for all people (regardless of filters)
    const people = applyFilter
      ? this.filteredPeople
      : this.workflowsStore.caseloadPersons;

    return people.flatMap((person) => {
      const { supervisionTasks } = person;

      if (!supervisionTasks) return [];

      if (category === "HIDDEN") {
        return supervisionTasks.orderedTasks.filter(
          (t) => (this.taskMatchesFilters(t) || !applyFilter) && t.isSnoozed,
        );
      }

      const hasThisWeekTab =
        this.displayedTaskCategories.includes("DUE_THIS_WEEK");

      return supervisionTasks.readyOrderedTasks.filter((t) => {
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

    // return true if the person has any tasks that match the filters
    return person.supervisionTasks?.orderedTasks
      ? person.supervisionTasks?.orderedTasks.some((task) =>
          this.taskMatchesFilters(task),
        )
      : false;
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
