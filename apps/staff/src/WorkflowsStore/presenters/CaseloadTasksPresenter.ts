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

import { every } from "lodash";
import { makeAutoObservable } from "mobx";

import {
  TaskFilterField,
  TaskFilterOption,
  TaskFilterSection,
  WorkflowsTasksConfig,
} from "../../core/models/types";
import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { PartialRecord } from "../../utils/typeUtils";
import { taskDueDateComparator } from "../Task/TasksBase";
import { SupervisionTask } from "../Task/types";
import { taskPageDescriptionForState } from "../Task/utils";
import { JusticeInvolvedPerson } from "../types";
import { WorkflowsStore } from "../WorkflowsStore";

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

type SelectedFilters = PartialRecord<TaskFilterField, TaskFilterOption>;

export class CaseloadTasksPresenter {
  selectedCategory: SupervisionTaskCategory;
  _selectedFilters: SelectedFilters = {};

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    protected analyticsStore: AnalyticsStore,
  ) {
    makeAutoObservable(this);
    this.selectedCategory = "ALL_TASKS_OLD";
  }

  get taskConfig(): WorkflowsTasksConfig {
    const { tasksConfiguration, currentTenantId } = this.tenantStore;
    if (!tasksConfiguration) {
      throw new Error(
        `Trying to initialize CaseloadTaskPresenter for state without task configuration: ${currentTenantId}`,
      );
    }
    return tasksConfiguration;
  }

  get taskCategories(): SupervisionTaskCategory[] {
    return this.tenantStore.taskCategories;
  }

  // Categories used in the original tasks view in ID
  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return ["ALL_TASKS_OLD", ...this.taskCategories];
  }

  get selectedTaskCategory(): SupervisionTaskCategory {
    return this.selectedCategory;
  }

  set selectedTaskCategory(newCategory: SupervisionTaskCategory) {
    this.selectedCategory = newCategory;
  }

  // This function toggles between the selected category and the default
  // category "ALL_TASKS_OLD". If the selected category is the current
  // category, it will switch back to "ALL_TASKS_OLD".
  toggleSelectedTaskCategory(newCategory: SupervisionTaskCategory): void {
    this.selectedCategory =
      this.selectedCategory === newCategory ? "ALL_TASKS_OLD" : newCategory;

    this.analyticsStore.trackTaskFilterSelected({
      taskCategory: this.selectedCategory,
      selectedSearchIds: this.workflowsStore.searchStore.selectedSearchIds,
    });
  }

  orderedTasksForCategory(
    category: SupervisionTaskCategory,
  ): SupervisionTask[] {
    return this.filteredPeople
      .flatMap((person) => {
        const { supervisionTasks } = person;

        if (!supervisionTasks) return [];

        return supervisionTasks.readyOrderedTasks.filter(
          (t) => t.type === category,
        );
      })
      .sort(taskDueDateComparator);
  }

  get orderedTasksForSelectedCategory(): SupervisionTask[] {
    return this.orderedTasksForCategory(this.selectedCategory);
  }

  countForCategory(category: SupervisionTaskCategory): number {
    switch (category) {
      case "ALL_TASKS_OLD":
        // When viewing ALL_TASKS_OLD, we count people instead of tasks
        return (
          this.clientsWithOverdueTasks.length +
          this.clientsWithUpcomingTasks.length
        );
      default:
        return this.orderedTasksForCategory(category).length;
    }
  }

  personMatchesFilters(person: JusticeInvolvedPerson): boolean {
    return every(
      Object.entries(this.selectedFilters),
      ([field, options]: [keyof JusticeInvolvedPerson, TaskFilterOption]) =>
        person[field] === options.value,
    );
  }

  get filteredPeople(): JusticeInvolvedPerson[] {
    return this.workflowsStore.caseloadPersons.filter((p) =>
      this.personMatchesFilters(p),
    );
  }

  get clientsWithOverdueTasks(): JusticeInvolvedPerson[] {
    return this.filteredPeople
      .filter(
        (person) => (person.supervisionTasks?.overdueTasks.length ?? 0) > 0,
      )
      .sort(sortPeopleByNextTaskDueDate);
  }

  get clientsWithUpcomingTasks(): JusticeInvolvedPerson[] {
    return this.filteredPeople
      .filter(
        (person) =>
          (person.supervisionTasks?.overdueTasks.length ?? 0) === 0 &&
          (person.supervisionTasks?.upcomingTasks.length ?? 0) > 0,
      )
      .sort(sortPeopleByNextTaskDueDate);
  }

  // Filter controls

  get filters(): TaskFilterSection[] {
    const { filters } = this.taskConfig;
    if (!filters) return [];

    return filters;
  }

  get selectedFilters(): SelectedFilters {
    return this._selectedFilters;
  }

  setFilter(field: TaskFilterField, option: TaskFilterOption) {
    this._selectedFilters[field] = option;
  }

  resetFilters() {
    this._selectedFilters = {};
  }

  // Text shown at the top of the Tasks page
  get pageDescription() {
    return taskPageDescriptionForState(this.tenantStore.currentTenantId);
  }
}
