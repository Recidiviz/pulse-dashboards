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

import { isThisMonth, isThisWeek } from "date-fns";
import { every } from "lodash";
import { makeAutoObservable } from "mobx";

import {
  TaskFilterField,
  TaskFilterOption,
  TaskFilterSection,
  WorkflowsTasksConfig,
} from "../../core/models/types";
import {
  SupervisionTaskCategory,
  TEMPORAL_TASK_CATEGORIES,
} from "../../core/WorkflowsTasks/fixtures";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { PartialRecord } from "../../utils/typeUtils";
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

type SelectedFilters = PartialRecord<TaskFilterField, TaskFilterOption>;

export class CaseloadTasksPresenterV2 {
  selectedCategory: SupervisionTaskCategory;
  private _selectedFilters: SelectedFilters = {};

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    protected analyticsStore: AnalyticsStore,
  ) {
    makeAutoObservable(this);
    this.selectedCategory = "ALL_TASKS";
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

  // Tab categories used in the new tasks view
  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return [...TEMPORAL_TASK_CATEGORIES];
  }

  get selectedTaskCategory(): SupervisionTaskCategory {
    return this.selectedCategory;
  }

  set selectedTaskCategory(newCategory: SupervisionTaskCategory) {
    this.selectedCategory = newCategory;

    this.analyticsStore.trackTaskFilterSelected({
      taskCategory: this.selectedCategory,
      selectedSearchIds: this.workflowsStore.searchStore.selectedSearchIds,
    });
  }

  // Selection controls
  selectPerson(person: JusticeInvolvedPerson) {
    this.workflowsStore.updateSelectedPerson(person.pseudonymizedId);
  }

  shouldHighlightTask(task: SupervisionTask): boolean {
    return (
      task.person.pseudonymizedId ===
      this.workflowsStore.selectedPerson?.pseudonymizedId
    );
  }

  orderedTasksForCategory(
    category: SupervisionTaskCategory,
  ): SupervisionTask[] {
    return this.filteredPeople
      .flatMap((person) => {
        const { supervisionTasks } = person;

        if (!supervisionTasks) return [];

        if (category === "ALL_TASKS") return supervisionTasks.readyOrderedTasks;

        return supervisionTasks.readyOrderedTasks.filter((t) => {
          switch (category) {
            case "OVERDUE":
              return t.isOverdue;
            case "DUE_THIS_WEEK":
              return !t.isOverdue && isThisWeek(t.dueDate);
            case "DUE_THIS_MONTH":
              return (
                !t.isOverdue && !isThisWeek(t.dueDate) && isThisMonth(t.dueDate)
              );
            default:
              return false;
          }
        });
      })
      .sort(taskDueDateComparator);
  }

  get orderedTasksForSelectedCategory(): SupervisionTask[] {
    return this.orderedTasksForCategory(this.selectedCategory);
  }

  countForCategory(category: SupervisionTaskCategory): number {
    return this.orderedTasksForCategory(category).length;
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
}
