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

import {
  FilterField,
  FilterOption,
  FilterSection,
  FilterType,
  WorkflowsOpportunityFilterConfig,
  WorkflowsTasksConfig,
} from "../core/models/types";
import AnalyticsStore from "../RootStore/AnalyticsStore";
import TenantStore from "../RootStore/TenantStore";
import { PartialRecord } from "../utils/typeUtils";
import { WorkflowsStore } from "../WorkflowsStore";

type SelectedFilters = PartialRecord<FilterField, FilterOption["value"][]>;

export default abstract class FilterStoreBase {
  _selectedFilters: SelectedFilters = {};

  constructor(
    protected readonly analyticsStore: AnalyticsStore,
    readonly tenantStore: TenantStore,
    protected readonly workflowsStore: WorkflowsStore,
  ) {}

  // Shared filter controls

  abstract filterConfig:
    | WorkflowsTasksConfig
    | WorkflowsOpportunityFilterConfig;
  // Deselect all filters. All people will show after this
  abstract clearFilters: () => void;
  abstract trackFiltersReset: () => void;
  abstract trackFilterChanged: (
    field: FilterField,
    option: FilterOption,
    changedFilterSelected?: boolean,
    onlyClicked?: boolean,
  ) => void;

  get filters(): FilterSection[] {
    const { filters } = this.filterConfig;
    if (!filters) return [];

    return filters;
  }

  get someFiltersSet(): boolean {
    return this.filters.some(
      (filter) =>
        this._selectedFilters[filter.field] &&
        this._selectedFilters[filter.field]?.length !== 0,
    );
  }

  get allFiltersSelected(): boolean {
    return this.filters.every(
      (filter) =>
        this._selectedFilters[filter.field]?.length === filter.options.length,
    );
  }

  get selectedFilters(): SelectedFilters {
    return this._selectedFilters;
  }

  filterIsSelected(field: FilterField, { value }: FilterOption): boolean {
    return Boolean(this._selectedFilters[field]?.includes(value));
  }

  toggleFilter(field: FilterField, option: FilterOption) {
    if (this.filterIsSelected(field, option)) {
      this.unsetFilter(field, option);
    } else {
      this.setFilter(field, option);
    }
  }

  // Select all filters
  selectAllFilters() {
    this.trackFiltersReset();

    if (!this.filters) return;

    this._selectedFilters = {};

    for (const filter of this.filters) {
      this._selectedFilters[filter.field] = filter.options.map(
        (option) => option.value,
      );
    }
  }

  unsetFilter(field: FilterField, option: FilterOption) {
    const { value } = option;

    if (this._selectedFilters[field]?.length === 1) {
      // If only 1 filter selected, clear filters of that type
      this._selectedFilters = Object.fromEntries(
        Object.entries(this._selectedFilters).filter(([k, v]) => k !== field),
      );
    } else {
      // If more than 1 filter selected, remove deselected filter
      this._selectedFilters[field] = this._selectedFilters[field]?.filter(
        (f) => f !== value,
      );
    }

    this.trackFilterChanged(field, option);
  }

  setFilter(field: FilterField, option: FilterOption) {
    const { value } = option;

    if (!this._selectedFilters[field]) {
      this._selectedFilters[field] = [value];
    } else if (!this.filterIsSelected(field, option)) {
      this._selectedFilters[field]?.push(value);
    }

    this.trackFilterChanged(field, option);
  }

  selectedFiltersForType(filterType: FilterType): SelectedFilters {
    return Object.fromEntries(
      Object.entries(this._selectedFilters).filter(
        ([field, _]) =>
          this.filters.find((f) => f.field === field)?.type === filterType,
      ),
    );
  }

  setOnlyFilterForField = (field: FilterField, option: FilterOption) => {
    const { value } = option;

    this._selectedFilters[field] = [value];

    this.trackFilterChanged(field, option, true, true);
  };
}
