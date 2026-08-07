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

import { groupBy } from "lodash";
import { action, comparer, makeAutoObservable, reaction } from "mobx";

import { pluralizeWord } from "~utils";

import { FilterField, FilterOption, FilterType } from "../../core/models/types";
import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import {
  TasksTablePresenter,
  TaskTableColumnId,
} from "../../core/WorkflowsTasks/TasksTable";
import { FilterPresenter } from "../../FilterStore/FilterPresenter";
import TasksFilterStore from "../../FilterStore/TasksFilterStore";
import FirestoreStore from "../../FirestoreStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import {
  ClientTasksSummary,
  TasksRowEntity,
  TaskTableItem,
} from "../Task/types";
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

export class CaseloadTasksPresenterV2
  implements
    TasksTablePresenter,
    TableViewSelectInterface,
    FilterPresenter<TasksFilterStore>
{
  private _selectedCategory: SupervisionTaskCategory | undefined = undefined;
  private tableViewSelectPresenter: TableViewSelectPresenter;
  private _navigablePeople: JusticeInvolvedPerson[] = [];

  constructor(
    protected workflowsStore: WorkflowsStore,
    protected tenantStore: TenantStore,
    public readonly filterStore: TasksFilterStore,
    protected analyticsStore: AnalyticsStore,
    protected firestoreStore: FirestoreStore,
    protected featureVariants: FeatureVariantRecord,
  ) {
    // only update the list of tasks to navigate through when necessary,
    // to avoid changing the list when a task is snoozed
    reaction(
      () => this.workflowsStore.selectedPerson,
      (nextClient: JusticeInvolvedPerson | undefined) => {
        if (!nextClient || !this._navigablePeople.includes(nextClient))
          this.updateNavigablePeople();
      },
    );
    // The selected tab belongs to a single search: a category the user picked
    // for the previous caseload may be empty for the next one, and
    // `selectedCategory` only falls back to the first non-empty category while
    // nothing has been picked. This presenter outlives a search (it backs the
    // whole page, not just the hydrated table), so clear the selection here.
    reaction(
      () => this.workflowsStore.searchStore.selectedSearchIds,
      () => this.resetSelectedCategory(),
      // `selectedSearchIds` returns a new array whenever the user record
      // updates, so compare contents rather than identity
      { equals: comparer.shallow },
    );

    makeAutoObservable(this, {
      updateNavigablePeople: action,
      resetSelectedCategory: action,
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
        this.filterStore.countForSupervisionTaskCategory(newCategory),
      selectedCaseloadIds: this.workflowsStore.searchStore.selectedSearchIds,
    });

    this._selectedCategory = newCategory;
  }

  /**
   * Drops the user's tab selection so `selectedCategory` recomputes its default
   * from the categories available for the current search.
   */
  resetSelectedCategory(): void {
    this._selectedCategory = undefined;
  }

  get selectedCategory(): SupervisionTaskCategory {
    return (
      this._selectedCategory ??
      // If the user hasn't selected anything, default to the first non-empty category
      this.displayedTaskCategories.find(
        (category) =>
          this.filterStore.countForSupervisionTaskCategory(category) > 0,
      ) ??
      this.displayedTaskCategories[0]
    );
  }

  // Selection controls
  selectPerson(person: JusticeInvolvedPerson) {
    this.workflowsStore.updateSelectedPerson(person.pseudonymizedId);
  }

  get shouldSortByLastName(): boolean {
    return this.tenantStore.stateCode === "US_TX";
  }

  shouldHighlightRow({ person }: TasksRowEntity): boolean {
    return (
      person.pseudonymizedId ===
      this.workflowsStore.selectedPerson?.pseudonymizedId
    );
  }

  get clientsWithOverdueTasks(): JusticeInvolvedPerson[] {
    return this.filterStore.filteredPeople
      .filter(
        (person) => (person.supervisionTasks?.overdueTasks.length ?? 0) > 0,
      )
      .sort(sortPeopleByNextTaskDueDate);
  }

  get clientsWithUpcomingTasks(): JusticeInvolvedPerson[] {
    return this.filterStore.filteredPeople
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

  get orderedTasksForSelectedCategory(): TaskTableItem[] {
    return this.filterStore.orderedTasksForSelectedCategory(
      this.selectedCategory,
    );
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

  get isTypesenseSearchEnabled(): boolean {
    return this.workflowsStore.searchStore.isTypesenseSearchEnabled;
  }

  get isInitial(): boolean {
    return !this.workflowsStore.searchStore.selectedSearchIds.length;
  }

  // True once a searched caseload has loaded with at least one task.
  get hasTasks(): boolean {
    return (
      !this.isInitial &&
      this.workflowsStore.supervisionTasksLoaded() &&
      this.workflowsStore.hasSupervisionTasks
    );
  }

  // True once a searched caseload has loaded but has no tasks.
  get noTasks(): boolean {
    return (
      !this.isInitial &&
      this.workflowsStore.supervisionTasksLoaded() &&
      !this.workflowsStore.hasSupervisionTasks
    );
  }

  get initialCallToActionText(): string {
    const { workflowsSearchFieldTitle } = this.workflowsStore.searchStore;
    const { justiceInvolvedPersonTitle } = this.workflowsStore;
    // With the FV the prompt renders above the search bar, so it points "below";
    // otherwise it renders below the search, so "above".
    const searchLocation = this.isTypesenseSearchEnabled ? "below" : "above";
    return this.isTypesenseSearchEnabled && workflowsSearchFieldTitle
      ? `Start typing the name of ${workflowsSearchFieldTitle} ${searchLocation} to review ${justiceInvolvedPersonTitle}s who have upcoming or overdue tasks.`
      : `Search ${searchLocation} to review ${justiceInvolvedPersonTitle}s who have upcoming or overdue tasks.`;
  }

  get emptyCallToActionText(): string {
    return `None of the ${this.workflowsStore.justiceInvolvedPersonTitle}s on the selected caseloads have any tasks. Search for another caseload.`;
  }

  // Subheader shown above the search bar (FV): the search prompt before a search
  // and the "no tasks" message when a searched caseload has none. Undefined
  // while loading or once tasks load — the page description renders instead.
  get subheaderCopy(): string | undefined {
    if (this.isInitial) return this.initialCallToActionText;
    if (this.noTasks) return this.emptyCallToActionText;
    return undefined;
  }

  get displayIdHeader() {
    // Header text for the "display ID" column in table view
    return this.tenantStore.getDisplayIdCopy("SUPERVISION");
  }

  get tasksTableColumns(): TaskTableColumnId[] {
    const columns = this.tenantStore.tasksTableColumns;
    if (this.showOneRowPerClient) {
      // Filter out task-specific columns in client mode
      return columns.filter(
        (col) => col !== "frequency" && col !== "appointmentStatus",
      );
    }
    return columns;
  }

  countForCategory(category: SupervisionTaskCategory): number {
    return this.filterStore.orderedTasksForCategory(category).length;
  }

  personsCountForCategory(category: SupervisionTaskCategory): number {
    return this.filterStore.orderedPersonsForCategory(category).length;
  }

  get rowEntitiesForSelectedCategory(): TasksRowEntity[] {
    if (this.showOneRowPerClient) {
      return this.orderedClientsWithTaskSummaries;
    }
    return this.orderedTasksForSelectedCategory;
  }

  get showOneRowPerClient(): boolean {
    return !!this.featureVariants.tasksOneRowPerClient;
  }

  get orderedClientsWithTaskSummaries(): ClientTasksSummary[] {
    const tasksByClient = groupBy(
      this.orderedTasksForSelectedCategory,
      (task) => task.person.pseudonymizedId,
    );

    return Object.values(tasksByClient).map((clientTasks) => ({
      person: clientTasks[0].person,
      tasks: clientTasks,
    }));
  }

  trackFilterDropdownOpened() {
    return this.filterStore.trackTaskFilterDropdownOpened;
  }

  get displayedTaskCategories(): SupervisionTaskCategory[] {
    return this.filterStore.displayedTaskCategories;
  }

  allTasksForCategory(
    category: SupervisionTaskCategory,
    applyFilter = true,
  ): TaskTableItem[] {
    return this.filterStore.allTasksForCategory(category, applyFilter);
  }

  get selectedFilters() {
    return this.filterStore.selectedFilters;
  }

  orderedPersonsForCategory(
    category: SupervisionTaskCategory,
  ): JusticeInvolvedPerson[] {
    return this.filterStore.orderedPersonsForCategory(category);
  }

  // Route planner-related settings
  get showRoutePlannerLink() {
    return Boolean(
      this.workflowsStore.rootStore.userStore.activeFeatureVariants
        .tasksRoutePlanner,
    );
  }
}
