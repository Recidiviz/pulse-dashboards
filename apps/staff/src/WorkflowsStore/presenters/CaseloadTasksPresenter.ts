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

import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { PartialRecord } from "../../utils/typeUtils";
import { Client } from "../Client";
import { taskDueDateComparator } from "../Task/TasksBase";
import { SupervisionTask } from "../Task/types";
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

// TODO: move these onto state-level configs
const TASK_FILTER_CONFIG = {
  supervisionLevel: [
    { value: "Low" },
    { value: "Moderate" },
    { value: "High" },
  ],
} satisfies FilterConfig;

export type TaskFilterOption = { value: string; label?: string };
export type TaskFilterField = keyof Client;
type SelectedFilters = PartialRecord<TaskFilterField, TaskFilterOption>;
type FilterConfig = PartialRecord<TaskFilterField, TaskFilterOption[]>;

export class CaseloadTasksPresenter {
  selectedCategory: SupervisionTaskCategory = "DUE_THIS_MONTH";
  filterConfig: FilterConfig;
  _selectedFilters: SelectedFilters = {};

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    protected analyticsStore: AnalyticsStore,
  ) {
    this.filterConfig = TASK_FILTER_CONFIG;
    makeAutoObservable(this);
  }

  get taskCategories(): SupervisionTaskCategory[] {
    return this.tenantStore.taskCategories;
  }

  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return ["DUE_THIS_MONTH", ...this.taskCategories];
  }

  get selectedTaskCategory(): SupervisionTaskCategory {
    return this.selectedCategory;
  }

  // This function toggles between the selected category and the default
  // category "DUE_THIS_MONTH". If the selected category is the current
  // category, it will switch back to "DUE_THIS_MONTH".
  toggleSelectedTaskCategory(newCategory: SupervisionTaskCategory): void {
    this.selectedCategory =
      this.selectedCategory === newCategory ? "DUE_THIS_MONTH" : newCategory;

    this.analyticsStore.trackTaskFilterSelected({
      taskCategory: this.selectedCategory,
      selectedSearchIds: this.workflowsStore.selectedSearchIds,
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
      case "DUE_THIS_MONTH":
        // When viewing DUE_THIS_MONTH, we count people instead of tasks
        return (
          this.clientsWithOverdueTasks.length +
          this.clientsWithUpcomingTasks.length
        );
      default:
        return this.orderedTasksForCategory(category).length;
    }
  }

  personmatchesFilters(person: JusticeInvolvedPerson): boolean {
    return every(
      Object.entries(this.selectedFilters),
      // @ts-expect-error
      ([field, options]) => person[field] === options.value,
    );
  }

  get filteredPeople(): JusticeInvolvedPerson[] {
    return this.workflowsStore.caseloadPersons.filter((p) =>
      this.personmatchesFilters(p),
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

  get filters(): FilterConfig {
    return this.filterConfig;
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
}
