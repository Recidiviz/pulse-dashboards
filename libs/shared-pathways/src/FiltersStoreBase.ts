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

import { get, keys, set, toJS } from "mobx";

import { FILTER_TYPES, filtersOrder } from "./constants";
import { enabledFilterOptionsByTenant } from "./enabledFilters";
import {
  defaultMetricMode,
  DefaultPopulationFilterOptions,
  defaultPopulationFilterValues,
  filterOptionsByTenant,
  getFilterOptions,
} from "./filterOptions";
import {
  DynamicFilterOptions,
  EnabledFilter,
  EnabledFilters,
  EnabledFiltersByMetric,
  FilterOption,
  Filters,
  FilterType,
  PopulationFilterLabels,
  PopulationFilters,
  PopulationFilterValues,
} from "./filters";
import { PathwaysTenantId, US_DEMO } from "./tenants";
import { formatTimePeriodLabel } from "./timePeriod";
import { MonthOptions } from "./types";

export abstract class FiltersStoreBase {
  filters: PopulationFilterValues = defaultPopulationFilterValues;

  metricMode: string = defaultMetricMode;

  setFilters(updatedFilters: Partial<PopulationFilterValues>): void {
    Object.keys(updatedFilters).forEach((filterKey) => {
      const updatedFilterValue =
        updatedFilters[filterKey as keyof PopulationFilters];
      set(
        this.filters,
        filterKey,
        // TODO(#10250) Remove this default value once Pathways hydration has been refactored
        // Set ["ALL"] as the default value if defaultFilterOptions are still loading
        updatedFilterValue && updatedFilterValue.length > 0
          ? updatedFilterValue
          : ["ALL"],
      );
    });
  }

  clearDisabledFilters(filters: Filters = { enabledFilters: [] }): void {
    const currentlyEnabledFilters = [
      ...filters.enabledFilters,
      ...(filters.enabledMoreFilters || []),
    ];
    (keys(this.filters) as FilterType[]).forEach((filterType) => {
      if (
        filterType !== FILTER_TYPES.TIME_PERIOD &&
        !currentlyEnabledFilters.includes(filterType)
      )
        this.setFilters({ [filterType]: ["ALL"] });
    });
  }

  setMetricMode(metricMode: string): void {
    this.metricMode = metricMode;
  }

  resetFilters(): void {
    this.setFilters(defaultPopulationFilterValues);
  }

  // --- Simple derived getters ---

  get timePeriodLabel(): string {
    return formatTimePeriodLabel(get(this.filters, "timePeriod"));
  }

  get monthRange(): MonthOptions {
    // the timePeriod filter will only ever be single-select so always use the 0 index
    return parseInt(this.filters.timePeriod[0]) as MonthOptions;
  }

  get currentMetricMode(): string {
    return this.metricMode;
  }

  get filtersLabels(): PopulationFilterLabels {
    return (keys(this.filters) as FilterType[]).reduce((acc, filterType) => {
      const filter = this.filterOptions[filterType];
      const labels = getFilterOptions(
        this.filters[filter.type] as string[],
        filter.options,
      )
        .map((o) => o.label)
        .join(", ");
      acc[filterType] = labels;
      return acc;
    }, {} as PopulationFilterLabels);
  }

  // --- Metric-derived getters ---

  get sortedFilters(): EnabledFilters {
    return filtersOrder.filter((item: EnabledFilter) =>
      this.metric.filters?.enabledFilters.includes(item),
    );
  }

  get filtersDescription(): string {
    const filters = toJS(this.filters);
    const filterKeys = Object.keys(filters) as FilterType[];
    const filtersStrings = filterKeys.reduce((acc: string[], key) => {
      if (
        this.metric?.filters.enabledFilters.includes(key) ||
        this.metric?.filters.enabledMoreFilters?.includes(key)
      ) {
        const { title } = this.filterOptions[key];
        acc.push(`${title}: ${this.filtersLabels[key]}`);
      }

      return acc;
    }, []);
    return filtersStrings.join(";\n").concat("\n");
  }

  get enabledFiltersDefaultQueryString(): Record<string, string> {
    const query: Record<string, string> = {};
    [
      ...this.metric.filters.enabledFilters,
      ...(this.metric.filters.enabledMoreFilters ?? []),
    ].forEach((filterType) => {
      query[filterType] =
        this.filterOptions[
          filterType as keyof PopulationFilters
        ].defaultOption.label;
    });
    return query;
  }

  // --- Lookup helpers ---

  getFilterLabel(
    filterType: keyof PopulationFilters,
    filterValue: string,
  ): string {
    return (
      this.filterOptions[filterType]?.options.find(
        (option: FilterOption) => option.value === filterValue,
      )?.label || ""
    );
  }

  getFilterLongLabel(
    filterType: keyof PopulationFilters,
    filterValue: string,
  ): string | undefined {
    return (
      this.filterOptions[filterType].options.find(
        (option: FilterOption) => option.value === filterValue,
      )?.longLabel || undefined
    );
  }

  // --- Tenant/metric-derived getters ---

  get isUsingDemoData(): boolean {
    return false;
  }

  get enabledFilters(): EnabledFiltersByMetric {
    return (this.pathwaysTenantId
      ? enabledFilterOptionsByTenant[this.pathwaysTenantId]
      : undefined) as unknown as EnabledFiltersByMetric;
  }

  get filterOptions(): PopulationFilters {
    const staticFilterOptions = this.pathwaysTenantId
      ? {
          ...filterOptionsByTenant[
            this.isUsingDemoData ? US_DEMO : this.pathwaysTenantId
          ],
        }
      : DefaultPopulationFilterOptions;

    return this.metric.hydrationState.status === "hydrated"
      ? Object.entries(this.metric.dynamicFilterOptions).reduce(
          (acc, [filterType, dynamicOptions]) => {
            if (
              dynamicOptions &&
              acc[filterType as FilterType].useDynamicOptions
            ) {
              acc[filterType as FilterType].options = [
                { label: "All", value: "ALL" },
                ...dynamicOptions,
              ];
            }
            return acc;
          },
          staticFilterOptions,
        )
      : staticFilterOptions;
  }

  // --- Abstract (subclass implements) ---

  abstract get metric(): {
    filters: Filters;
    hydrationState: { status: string };
    dynamicFilterOptions: Partial<DynamicFilterOptions>;
  };

  abstract get pathwaysTenantId(): PathwaysTenantId | undefined;
}
