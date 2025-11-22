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

import { action, makeAutoObservable, reaction } from "mobx";

import {
  FilterField,
  FilterOption,
  FilterSection,
  FilterType,
} from "../../core/models/types";
import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import { TaskTableColumnId } from "../../core/WorkflowsTasks/TasksTable";
import TasksFilterStore from "../../FilterStore/TasksFilterStore";
import FirestoreStore from "../../FirestoreStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import { pluralizeWord } from "../../utils/formatStrings";
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

export class CaseloadTasksPresenterV2 implements TableViewSelectInterface {
  private _selectedCategory: SupervisionTaskCategory | undefined = undefined;
  private tableViewSelectPresenter: TableViewSelectPresenter;
  private _navigablePeople: JusticeInvolvedPerson[] = [];
  readonly filters: FilterSection[];

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    protected tasksFilterStore: TasksFilterStore,
    protected analyticsStore: AnalyticsStore,
    protected firestoreStore: FirestoreStore,
    protected featureVariants: FeatureVariantRecord,
  ) {
    this.filters = this.tasksFilterStore.filters;

    // only update the list of tasks to navigate through when necessary,
    // to avoid changing the list when a task is snoozed
    reaction(
      () => this.workflowsStore.selectedPerson,
      (nextClient: JusticeInvolvedPerson | undefined) => {
        if (!nextClient || !this._navigablePeople.includes(nextClient))
          this.updateNavigablePeople();
      },
    );
    makeAutoObservable(this, {
      updateNavigablePeople: action,
    });

    this.tableViewSelectPresenter = new TableViewSelectPresenter(
      firestoreStore,
      workflowsStore,
      featureVariants,
    );
  }

  get emptyTabText() {
    // "caseload" or "caseloads"
    const caseloadTerm = pluralizeWord({
      term: "caseload",
      count: this.workflowsStore.searchStore.selectedSearchables.length,
    });

    switch (this.selectedCategory) {
      case "ALL_TASKS":
        return `There are no contacts or assessments currently overdue or due within the next month for the selected ${caseloadTerm}.`;
      case "DUE_THIS_MONTH":
        return `There are no contacts or assessments currently due within the next month for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      case "DUE_NEXT_MONTH":
        return `There are no contacts or assessments currently due next month for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      case "DUE_THIS_WEEK":
        return `There are no contacts or assessments due within the next week for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      case "OVERDUE":
        return `There are no overdue contacts or assessments for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
      case "HIDDEN":
        return `There are no hidden contacts or assessments for the selected ${caseloadTerm}. Please navigate to one of the other tabs.`;
    }
  }

  get selectedTaskCategory(): SupervisionTaskCategory {
    return this.showListView ? "ALL_TASKS_OLD" : this.selectedCategory;
  }

  set selectedTaskCategory(newCategory: SupervisionTaskCategory) {
    this.analyticsStore.trackTaskTableCategorySelected({
      selectedCategory: newCategory,
      previousCategory: this.selectedCategory,
      newTabRowCount:
        this.tasksFilterStore.countForSupervisionTaskCategory(newCategory),
      selectedCaseloadIds: this.workflowsStore.searchStore.selectedSearchIds,
    });

    this._selectedCategory = newCategory;
  }

  get selectedCategory(): SupervisionTaskCategory {
    return (
      this._selectedCategory ??
      // If the user hasn't selected anything, default to the first non-empty category
      this.displayedTaskCategories.find(
        (category) =>
          this.tasksFilterStore.countForSupervisionTaskCategory(category) > 0,
      ) ??
      this.displayedTaskCategories[0]
    );
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

  get clientsWithOverdueTasks(): JusticeInvolvedPerson[] {
    return this.tasksFilterStore.filteredPeople
      .filter(
        (person) => (person.supervisionTasks?.overdueTasks.length ?? 0) > 0,
      )
      .sort(sortPeopleByNextTaskDueDate);
  }

  get clientsWithUpcomingTasks(): JusticeInvolvedPerson[] {
    return this.tasksFilterStore.filteredPeople
      .filter(
        (person) =>
          (person.supervisionTasks?.overdueTasks.length ?? 0) === 0 &&
          (person.supervisionTasks?.upcomingTasks.length ?? 0) > 0,
      )
      .sort(sortPeopleByNextTaskDueDate);
  }

  // Handle setting and getting the ordered list of people available to navigate between
  // in the footer of the task preview modal

  /**
   * This function is called from a reaction to update the list of people whenever
   * the preview modal is opened/closed or a person from a different category is selected.
   * This ensures that the currently selected person is always found within the list of
   * navigable people, so we can display reasonable numbers in the footer.
   * The list is not updated when the sort order of the table is changed or when different
   * filters are selected.
   */
  updateNavigablePeople() {
    this._navigablePeople = this.orderedTasksForSelectedCategory
      // Map all tasks in this category to clients
      .map((task) => task.person)
      // Filter out consecutive repeats
      .filter((client, i, allClients) => {
        return i === 0 || client !== allClients[i - 1];
      });
  }

  get navigablePeople(): JusticeInvolvedPerson[] {
    return this._navigablePeople;
  }

  // Filtering

  get orderedTasksForSelectedCategory(): SupervisionTask[] {
    return this.tasksFilterStore.orderedTasksForSelectedCategory(
      this.selectedCategory,
    );
  }

  filterIsSelected(field: FilterField, value: FilterOption): boolean {
    return this.tasksFilterStore.filterIsSelected(field, value);
  }

  toggleFilter(field: FilterField, option: FilterOption) {
    return this.tasksFilterStore.toggleFilter(field, option);
  }

  setOnlyFilterForField(field: FilterField, option: FilterOption) {
    return this.tasksFilterStore.setOnlyFilterForField(field, option);
  }

  // Return the number of total tasks, regardless of the current category and filters.
  numItems(type: FilterType, field: FilterField, option: FilterOption): number {
    const allTasks = this.allTasksForCategory("ALL_TASKS", false);

    return allTasks.filter((task) => {
      if (type === "task") {
        // @ts-expect-error we don't currently narrow the type of field adequately
        // but field should always be FilterFieldForTask here
        return task[field] === option.value;
      } else if (type === "person") {
        // @ts-expect-error same as above, with FilterFieldForPerson
        return task.person[field] === option.value;
      }
      return false;
    }).length;
  }

  clearFilters() {
    return this.tasksFilterStore.clearFilters();
  }

  get allFiltersSelected() {
    return this.tasksFilterStore.allFiltersSelected;
  }

  selectAllFilters() {
    return this.tasksFilterStore.selectAllFilters();
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
  get pageDescriptionMarkdown() {
    return this.tenantStore.tasksPageDescriptionMarkdown;
  }

  get displayIdHeader() {
    // Header text for the "display ID" column in table view
    return this.tenantStore.getDisplayIdCopy("SUPERVISION");
  }

  get tasksTableColumns(): TaskTableColumnId[] {
    return this.tenantStore.tasksTableColumns;
  }

  countForCategory(category: SupervisionTaskCategory): number {
    return this.orderedTasksForCategory(category).length;
  }

  orderedTasksForCategory(
    category: SupervisionTaskCategory,
  ): SupervisionTask[] {
    return this.tasksFilterStore.orderedTasksForCategory(category);
  }

  get someFiltersSet() {
    return this.tasksFilterStore.someFiltersSet;
  }

  trackFilterDropdownOpened() {
    return this.tasksFilterStore.trackTaskFilterDropdownOpened;
  }

  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return this.tasksFilterStore.displayedTaskCategories;
  }

  unsetFilter(field: FilterField, option: FilterOption) {
    this.tasksFilterStore.unsetFilter(field, option);
  }

  allTasksForCategory(
    category: SupervisionTaskCategory,
    applyFilter = true,
  ): SupervisionTask[] {
    return this.tasksFilterStore.allTasksForCategory(category, applyFilter);
  }

  setFilter(field: FilterField, option: FilterOption) {
    this.tasksFilterStore.setFilter(field, option);
  }

  get selectedFilters() {
    return this.tasksFilterStore.selectedFilters;
  }

  orderedPersonsForCategory(
    category: SupervisionTaskCategory,
  ): JusticeInvolvedPerson[] {
    return this.tasksFilterStore.orderedPersonsForCategory(category);
  }

  // Route planner-related settings
  get showRoutePlannerLink() {
    return Boolean(
      this.workflowsStore.rootStore.userStore.activeFeatureVariants
        .tasksRoutePlanner,
    );
  }
}
