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
import { every, some } from "lodash";
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
import { taskPageDescriptionForState } from "../Task/utils";
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
  private selectedCategory: SupervisionTaskCategory;
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

    this.initializeFilters();
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

  // Set the initial state of the filters, which is having every option selected
  initializeFilters() {
    const {
      taskConfig: { filters },
    } = this;

    if (!filters) return;

    this._selectedFilters = {};

    for (const filter of filters) {
      this._selectedFilters[filter.field] = filter.options.map(
        (option) => option.value,
      );
    }
  }

  // Tab categories used in the new tasks view
  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return [...TEMPORAL_TASK_CATEGORIES];
  }

  get selectedTaskCategory(): SupervisionTaskCategory {
    return this.showListView ? "ALL_TASKS_OLD" : this.selectedCategory;
  }

  set selectedTaskCategory(newCategory: SupervisionTaskCategory) {
    this.analyticsStore.trackTaskTableCategorySelected({
      selectedCategory: newCategory,
      previousCategory: this.selectedCategory,
      newTabRowCount: this.countForCategory(newCategory),
      selectedCaseloadIds: this.workflowsStore.searchStore.selectedSearchIds,
    });

    this.selectedCategory = newCategory;
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
    const filters = Object.entries(this.selectedFiltersForType("task"));

    return every(
      filters,
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
    const filters = Object.entries(this.selectedFiltersForType("person"));

    const matchesPeopleFilters = every(
      filters,
      ([field, options]: [TaskFilterFieldForPerson, string[]]) =>
        // @ts-expect-error searchable fields are restricted to strings but TS does not know that
        options.includes(person[field]),
    );

    if (!matchesPeopleFilters) return false;

    // return true if the person has any tasks that match the filters
    return some(person.supervisionTasks?.readyOrderedTasks ?? [], (task) =>
      this.taskMatchesFilters(task),
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

  get allFiltersSelected(): boolean {
    const { filters } = this;

    return every(
      filters,
      (filter) =>
        this._selectedFilters[filter.field]?.length === filter.options.length,
    );
  }

  setFilter(field: TaskFilterField, option: TaskFilterOption) {
    const { value } = option;

    if (!this._selectedFilters[field]) {
      this._selectedFilters[field] = [value];
    } else if (!this.filterIsSelected(field, option)) {
      this._selectedFilters[field]?.push(value);
    }

    this.analyticsStore.trackTaskFilterChanged({
      changedFilterCategory: field,
      changedFilterValue: option.value,
      changedFilterSelected: true,
      selectedFilters: this._selectedFilters,
      onlyClicked: false,
    });
  }

  unsetFilter(field: TaskFilterField, option: TaskFilterOption) {
    const { value } = option;

    if (this._selectedFilters[field]?.length === 1) {
      delete this._selectedFilters[field];
    } else {
      this._selectedFilters[field] = this._selectedFilters[field]?.filter(
        (f) => f !== value,
      );
    }

    this.analyticsStore.trackTaskFilterChanged({
      changedFilterCategory: field,
      changedFilterValue: option.value,
      changedFilterSelected: false,
      selectedFilters: this._selectedFilters,
      onlyClicked: false,
    });
  }

  toggleFilter(field: TaskFilterField, option: TaskFilterOption) {
    if (this.filterIsSelected(field, option)) {
      this.unsetFilter(field, option);
    } else {
      this.setFilter(field, option);
    }
  }

  setOnlyFilterForField(field: TaskFilterField, option: TaskFilterOption) {
    const { value } = option;

    this._selectedFilters[field] = [value];

    this.analyticsStore.trackTaskFilterChanged({
      changedFilterCategory: field,
      changedFilterValue: option.value,
      changedFilterSelected: true,
      selectedFilters: this._selectedFilters,
      onlyClicked: true,
    });
  }

  // Reselect all filters to restore the initial state of showing everyone
  // Basically the same as calling initalizeFilters() but with logging
  resetFilters() {
    this.analyticsStore.trackTaskFiltersReset({
      selectedFiltersBeforeReset: this._selectedFilters,
    });
    this.initializeFilters();
  }

  // Deselect all filters. No tasks or people will show after this
  clearFilters() {
    for (const field in this._selectedFilters) {
      // @ts-expect-error TS doesn't know that the keys of this._selectedFilters are the keys of this._selectedFilters
      this._selectedFilters[field] = [];
    }
    this.analyticsStore.trackTaskFiltersCleared();
  }

  trackFilterDropdownOpened() {
    this.analyticsStore.trackTaskFilterDropdownOpened();
  }

  // List vs Table controls

  get showListView() {
    return this.tableViewSelectPresenter.showListView;
  }

  set showListView(showListView: boolean) {
    this.analyticsStore.trackTaskViewChanged({
      newViewType: showListView ? "list" : "table",
      oldViewType: this.showListView ? "list" : "table",
    });
    this.tableViewSelectPresenter.showListView = showListView;
  }

  // Text shown at the top of the Tasks page
  get pageDescription() {
    return taskPageDescriptionForState(this.tenantStore.currentTenantId);
  }
}
