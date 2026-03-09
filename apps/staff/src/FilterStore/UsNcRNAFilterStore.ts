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

import { action, computed, makeObservable, observable } from "mobx";

import { FilterField, FilterOption, FilterSection } from "../core/models/types";
import { RNADueTime } from "../core/UsNcRNA/RNAFilterPresenter";
import AnalyticsStore from "../RootStore/AnalyticsStore";
import { WorkflowsStore } from "../WorkflowsStore";
import FilterStoreBase from "./FilterStoreBase";

// Configuration for North Carolina RNA viewer filters
const rnaFilters: FilterSection<"usNcRNA">[] = [
  {
    title: "Assessment Status",
    type: "usNcRNA",
    field: "status",
    options: [
      {
        value: "UPCOMING",
        label: "Upcoming",
      },
      {
        value: "DUE",
        label: "Due",
      },
      {
        value: "NOT_STARTED",
        label: "Not Started",
      },
      {
        value: "IN_PROGRESS",
        label: "In Progress",
      },
      {
        value: "COMPLETE",
        label: "Complete – Review",
      },
    ],
  },
  {
    title: "Assessment Enabled",
    type: "usNcRNA",
    field: "isEnabled",
    options: [
      {
        value: true,
        label: "Yes",
      },
      {
        value: false,
        label: "No",
      },
    ],
  },
  {
    title: "Due in",
    type: "usNcRNA",
    field: "dueIn",
    options: [
      {
        value: "PAST",
        label: "the past",
      },
      {
        value: "NEXT_7_DAYS",
        label: "the next 7 days",
      },
      {
        value: "NEXT_30_DAYS",
        label: "the next 30 days",
      },
      {
        value: "NEXT_90_DAYS",
        label: "the next 90 days",
      },
    ] satisfies { value: RNADueTime; label: string }[],
  },
  {
    title: "Submitted to OPUS",
    type: "usNcRNA",
    field: "isSubmitted",
    options: [
      {
        value: true,
        label: "Yes",
      },
      {
        value: false,
        label: "No",
      },
    ],
  },
] as const;

/**
 * Provides information about the state of North Carolina RNA viewer filters.
 */
export default class UsNcRNAFilterStore extends FilterStoreBase {
  constructor(
    protected readonly analyticsStore: AnalyticsStore,
    protected readonly workflowsStore: WorkflowsStore,
  ) {
    super();

    // Default state: only non-submitted to OPUS assessments
    this._selectedFilters = {
      isSubmitted: [false],
    };

    makeObservable<UsNcRNAFilterStore>(this, {
      // State
      _selectedFilters: observable,

      // Computed based on filter state
      selectedFilters: computed,
      numFiltersSet: computed,
      allFiltersSelected: computed,

      // Actions that change filter state
      clearFilters: action,
      toggleFilter: action,
      selectAllFilters: action,
      unsetFilter: action,
      setFilter: action,
      setOnlyFilterForField: action,

      // Stuff that doesn't need to be tracked by mobx
      filters: false,
      filterConfig: false,
      trackFiltersReset: false,
      trackFilterChanged: false,
    });
  }

  filterConfig = { filters: rnaFilters };

  clearFilters = () => {
    this._selectedFilters = {};

    // TODO(#10892): add tracking
  };

  trackFiltersReset = () => {
    // TODO(#10892): add tracking
  };

  trackFilterChanged = (
    field: FilterField,
    option: FilterOption,
    changedFilterSelected?: boolean,
    onlyClicked?: boolean,
  ) => {
    // TODO(#10892): add tracking
  };
}
