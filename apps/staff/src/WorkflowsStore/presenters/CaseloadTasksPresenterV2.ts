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
  TaskFilterFieldForPerson,
  TaskFilterFieldForTask,
  TaskFilterOption,
  TaskFilterSection,
  TaskFilterType,
  WorkflowsTasksConfig,
} from "../../core/models/types";
import {
  SupervisionTaskCategory,
  TEMPORAL_TASK_CATEGORIES,
} from "../../core/WorkflowsTasks/fixtures";
import FirestoreStore from "../../FirestoreStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import { PartialRecord } from "../../utils/typeUtils";
import { taskDueDateComparator } from "../Task/TasksBase";
import { SupervisionTask } from "../Task/types";
import { JusticeInvolvedPerson } from "../types";
import { WorkflowsStore } from "../WorkflowsStore";
import {
  TableViewSelectInterface,
  TableViewSelectPresenter,
} from "./TableViewSelectPresenter";

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

type SelectedFilters = PartialRecord<
  TaskFilterField,
  TaskFilterOption["value"][]
>;

export class CaseloadTasksPresenterV2 implements TableViewSelectInterface {
  selectedCategory: SupervisionTaskCategory;
  private _selectedFilters: SelectedFilters = {};
  private tableViewSelectPresenter: TableViewSelectPresenter;

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    protected analyticsStore: AnalyticsStore,
    protected firestoreStore: FirestoreStore,
    protected featureVariants: FeatureVariantRecord,
  ) {
    makeAutoObservable(this);
    this.selectedCategory = "ALL_TASKS";
    this.tableViewSelectPresenter = new TableViewSelectPresenter(
      firestoreStore,
      workflowsStore,
      featureVariants,
    );
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

        return supervisionTasks.readyOrderedTasks.filter((t) => {
          if (!this.taskMatchesFilters(t)) return false;

          switch (category) {
            case "ALL_TASKS":
              return true;
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

  taskMatchesFilters(task: SupervisionTask): boolean {
    return every(
      Object.entries(this.selectedFiltersForType("task")),
      ([field, options]: [TaskFilterFieldForTask, string[]]) =>
        // @ts-expect-error searchable fields are restricted to strings but TS does not know that
        options.includes(task[field]),
    );
  }

  get orderedTasksForSelectedCategory(): SupervisionTask[] {
    return this.orderedTasksForCategory(this.selectedCategory);
  }

  countForCategory(category: SupervisionTaskCategory): number {
    return this.orderedTasksForCategory(category).length;
  }

  personMatchesFilters(person: JusticeInvolvedPerson): boolean {
    return every(
      Object.entries(this.selectedFiltersForType("person")),
      ([field, options]: [TaskFilterFieldForPerson, string[]]) =>
        // @ts-expect-error searchable fields are restricted to strings but TS does not know that
        options.includes(person[field]),
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

  selectedFiltersForType(filterType: TaskFilterType): SelectedFilters {
    return Object.fromEntries(
      Object.entries(this._selectedFilters).filter(
        ([field, _]) =>
          this.filters.find((f) => f.field === field)?.type === filterType,
      ),
    );
  }

  filterIsSelected(
    field: TaskFilterField,
    { value }: TaskFilterOption,
  ): boolean {
    return Boolean(this._selectedFilters[field]?.includes(value));
  }

  setFilter(field: TaskFilterField, option: TaskFilterOption) {
    const { value } = option;

    if (!this._selectedFilters[field]) {
      this._selectedFilters[field] = [value];
      return;
    }

    if (!this.filterIsSelected(field, option)) {
      this._selectedFilters[field]?.push(value);
    }
  }

  toggleFilter(field: TaskFilterField, option: TaskFilterOption) {
    const { value } = option;

    if (this.filterIsSelected(field, option)) {
      this._selectedFilters[field] = this._selectedFilters[field]?.filter(
        (f) => f !== value,
      );
    } else {
      this.setFilter(field, option);
    }
  }

  resetFilters() {
    this._selectedFilters = {};
  }

  get selectedFilterCount(): number {
    return Object.values(this._selectedFilters).flatMap((x) => x).length;
  }

  get showListView() {
    return this.tableViewSelectPresenter.showListView;
  }

  set showListView(showListView: boolean) {
    this.tableViewSelectPresenter.showListView = showListView;
  }

  // Text shown at the top of the Tasks page
  get pageDescription() {
    switch (this.tenantStore.currentTenantId) {
      case "US_ID":
        return "The clients below might have upcoming requirements this month. Hiding a below task will not change an officer's timeliness percentage in the Operations metrics.";
      case "US_TX":
        return "The clients below might have upcoming requirements this month. Data is refreshed from the OMS overnight and daily.";
      default:
        return "The clients below might have upcoming requirements this month.";
    }
  }
}
