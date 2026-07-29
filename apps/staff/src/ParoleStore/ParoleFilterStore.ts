// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { FilterConfig } from "../core/models/types";
import FilterStoreBase from "../FilterStore/FilterStoreBase";

type ParoleFilterField = "facility" | "hearingType";

/**
 * Backs the Parole docket page's WorkflowsFilterDropdown, following the same
 * FilterStoreBase/FilterPresenter contract as UsNcRNAFilterStore -- but with
 * the two static, string-valued fields the docket data has (facility,
 * hearing type) computed dynamically from whatever hearings are currently
 * hydrated, instead of a hardcoded option list.
 */
export class ParoleFilterStore extends FilterStoreBase {
  constructor(
    private readonly getFilterValues: () => Record<
      ParoleFilterField,
      Array<string>
    >,
  ) {
    super();

    // makeAutoObservable can't be used on a class with a superclass, so the
    // observable/computed/action annotations here are spelled out explicitly
    // instead, matching UsNcRNAFilterStore's pattern for the same base class.
    makeObservable<ParoleFilterStore>(this, {
      // State
      _selectedFilters: observable,

      // Computed based on filter state
      filterConfig: computed,
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
      trackFiltersReset: false,
      trackFilterChanged: false,
    });
  }

  get filterConfig(): FilterConfig {
    const values = this.getFilterValues();
    return {
      filters: [
        {
          title: "Facility",
          type: "parole",
          field: "facility",
          options: values.facility.map((value) => ({ value })),
        },
        {
          title: "Hearing Type",
          type: "parole",
          field: "hearingType",
          options: values.hearingType.map((value) => ({ value })),
        },
      ],
    };
  }

  clearFilters = () => {
    this._selectedFilters = {};
  };

  trackFiltersReset = () => {
    // No analytics tracking for the Parole docket yet.
  };

  trackFilterChanged = () => {
    // No analytics tracking for the Parole docket yet.
  };
}
