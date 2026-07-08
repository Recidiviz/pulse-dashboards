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
import { computed, makeObservable, reaction } from "mobx";

import {
  FilterField,
  FilterOption,
  FilterSection,
  TaskFilterValue,
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
  // Last-seen option values per dynamic field, used by `reconcileSelectedFilters`
  // to tell newly-appeared values apart from ones the user actively deselected.
  // Plain (non-observable) bookkeeping — only read/written inside the reconcile
  // action, which is driven by a reaction on `filters`.
  private _lastKnownOptionValues: Partial<
    Record<FilterField, TaskFilterValue[]>
  > = {};

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
      filters: computed,
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
      reconcileSelectedFilters: true,
      trackTaskFilterDropdownOpened: true,
      trackFiltersReset: true,
      trackFilterChanged: true,
    });

    // Dynamic option lists grow/shrink as the caseload subscription updates.
    // Keep `_selectedFilters` in step so a "select all" selection stays complete
    // (and stale values are pruned) rather than silently dropping clients whose
    // value appeared after the user selected. The store is a singleton for the
    // app's lifetime (RootStore), so the reaction needs no explicit disposal.
    //
    // The data function tracks only `caseloadPersons` — the sole runtime driver
    // of the (dynamic) option set; the static config and feature variants don't
    // change within a page session. Crucially, `this.filters` is read in the
    // EFFECT, not the tracked data function: reading it there runs untracked, so
    // it does NOT keep the cross-store `workflowsStore.featureVariants` computed
    // permanently observed. A permanently-observed computed stays memoized, which
    // silently serves stale values to any code that mutates feature variants
    // non-reactively (e.g. store tests assigning `rootStore.userStore`). Both
    // reads are guarded because the store graph may still be wiring up on setup
    // (`fireImmediately`) or in tests.
    reaction(
      () => {
        try {
          return this.workflowsStore.caseloadPersons;
        } catch {
          return undefined;
        }
      },
      () => {
        let currentFilters: FilterSection[];
        try {
          currentFilters = this.filters;
        } catch {
          return;
        }
        this.reconcileSelectedFilters(currentFilters);
      },
      { fireImmediately: true },
    );
  }

  get filters(): FilterSection[] {
    // TODO(#10615): Remove filter condition when UsIdTasksV2 is fully rolled out.
    const visibleFilters = super.filters.filter(({ title }) => {
      // Special case: hide "Task Type" filter for US_ID without v2 flag
      if (title === "Task Type" && this.workflowsStore.isUsIdLegacyTasksEnabled)
        return false;
      return true;
    });

    // When the `dynamicFilters` feature variant is on, extend each section that
    // opts in via `dynamic: true` (in the tenant config) with any values found
    // in the caseload data that the static config is missing, so every value
    // present in the data is selectable while the curated options are preserved.
    if (!this.workflowsStore.isDynamicFiltersEnabled) return visibleFilters;

    return visibleFilters.map((section) =>
      section.dynamic
        ? { ...section, options: this.dynamicOptionsForField(section) }
        : section,
    );
  }

  /**
   * Extends a section's static config options with any additional values present
   * in the current caseload. The full static config list is always retained
   * (preserving its curated `label`/`shortLabel` and order); values found in the
   * data but missing from the config are appended alphabetically, falling back
   * to the raw value for display (the dropdown renders
   * `shortLabel ?? label ?? value`).
   *
   * When the caseload subscription later adds or removes a distinct value, the
   * `reconcileSelectedFilters` reaction keeps `_selectedFilters` in step — so any
   * inconsistency in `allFiltersSelected` or the filtered view is transient
   * (until that reaction runs), not a standing gap.
   */
  private dynamicOptionsForField(section: FilterSection): FilterOption[] {
    const { field } = section;
    const configValues = new Set(section.options.map((option) => option.value));

    // Single pass over the caseload: collect distinct values not already in the
    // static config (the Set both dedupes and skips config values).
    const dataOnlyValues = new Set<string>();
    for (const person of this.workflowsStore.caseloadPersons) {
      // @ts-expect-error person fields are not statically narrowed to strings
      const value = person[field];
      if (
        typeof value === "string" &&
        value.length > 0 &&
        !configValues.has(value)
      ) {
        dataOnlyValues.add(value);
      }
    }

    const dataOnlyOptions = [...dataOnlyValues]
      .sort()
      .map((value) => ({ value }));

    return [...section.options, ...dataOnlyOptions];
  }

  /**
   * Keeps `_selectedFilters` consistent with a changed option set. For each
   * field with an active selection: prune values no longer offered, and — if the
   * field was previously fully selected — extend it with newly-appeared values so
   * a "select all" selection stays complete instead of silently excluding the
   * new value's clients. Genuine subset selections are left untouched. Fields
   * whose selection empties out are dropped, matching `unsetFilter`.
   */
  reconcileSelectedFilters(currentFilters: FilterSection[]) {
    for (const section of currentFilters) {
      const { field } = section;
      const currentValues = section.options.map((option) => option.value);
      const previousValues = this._lastKnownOptionValues[field];
      this._lastKnownOptionValues[field] = currentValues;

      const selected = this._selectedFilters[field];
      // Nothing to reconcile if the field has no active selection, or if we have
      // no prior snapshot to compare against (first observation of this field).
      if (!selected || selected.length === 0 || previousValues === undefined) {
        continue;
      }

      const currentValueSet = new Set(currentValues);
      const wasFullySelected = previousValues.every((value) =>
        selected.includes(value),
      );

      const next = wasFullySelected
        ? // Copy so the selection doesn't alias `_lastKnownOptionValues[field]`
          // (both would be `currentValues`); `setFilter` mutates the selection
          // array in place, which would otherwise corrupt the baseline snapshot.
          [...currentValues]
        : // Already a fresh array.
          selected.filter((value) => currentValueSet.has(value));

      // Drop the field entirely if the selection emptied out (matches `unsetFilter`).
      if (next.length === 0) {
        delete this._selectedFilters[field];
      } else {
        this._selectedFilters[field] = next;
      }
    }
  }

  get filterConfig(): WorkflowsTasksConfig {
    // `tenantStore.tasksConfiguration` throws if a tenant id is set before its
    // config is registered (app startup, and some tests). The `reconcileSelectedFilters`
    // reaction reads `filters` eagerly, so treat that window as "no config yet"
    // rather than letting it throw out of the reaction.
    let tasksConfiguration: WorkflowsTasksConfig | undefined;
    try {
      tasksConfiguration = this.tenantStore.tasksConfiguration;
    } catch {
      tasksConfiguration = undefined;
    }

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
