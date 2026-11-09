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

import { countBy } from "lodash";
import { get, keys, set, toJS } from "mobx";

import { formatDate } from "~utils";

import { FILTER_TYPES, filtersOrder } from "./constants";
import {
  defaultMetricMode,
  DefaultPopulationFilterOptions,
  defaultPopulationFilterValues,
  filterOptionsByTenant,
  getFilterOptions,
} from "./filterOptions";
import {
  COMPOUND_FILTER_VALUE_DELIMITER,
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
  splitCompoundFilterValue,
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
        updatedFilterValue ?? ["ALL"],
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
    this.setMetricMode(defaultMetricMode);
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

  /** Returns true if the chart header lists the given filter. */
  protected isFilterListedInDescription(filterType: FilterType): boolean {
    return (
      filterType !== FILTER_TYPES.DATE_IN_POPULATION &&
      (this.metric?.filters.enabledFilters.includes(filterType) ||
        !!this.metric?.filters.enabledMoreFilters?.includes(filterType))
    );
  }

  /**
   * Returns the selected option labels of a filter as the chart header shows
   * them. When two selected options share a label, such as an "Other" under
   * each of two groups, each one carries its group, e.g. "Other (Incarcerated
   * Parolees)". A filter with no selected option left after `isOptionShown`
   * reads "None".
   */
  protected getFilterDescriptionValue(
    filterType: FilterType,
    isOptionShown?: (option: FilterOption) => boolean,
  ): string {
    const filter = this.filterOptions[filterType];
    const allSelectedOptions = getFilterOptions(
      this.filters[filter.type] as string[],
      filter.options,
    );
    const selectedOptions = isOptionShown
      ? allSelectedOptions.filter(isOptionShown)
      : allSelectedOptions;
    if (isOptionShown && !selectedOptions.length) return "None";

    const labelCounts = countBy(selectedOptions, (option) => option.label);
    return selectedOptions
      .map((option) =>
        labelCounts[option.label] > 1 && option.group
          ? `${option.label} (${option.group})`
          : option.label,
      )
      .join(", ");
  }

  private describeFilters(isOptionShown?: (option: FilterOption) => boolean) {
    const filters = toJS(this.filters);
    const filterKeys = Object.keys(filters) as FilterType[];
    const filtersStrings = filterKeys.reduce((acc: string[], key) => {
      if (this.isFilterListedInDescription(key)) {
        const { title } = this.filterOptions[key];
        acc.push(
          `${title}: ${this.getFilterDescriptionValue(key, isOptionShown)}`,
        );
      }

      return acc;
    }, []);

    if (this.metric?.isOverTime && this.metric.lastUpdated) {
      filtersStrings.push(
        `Data last updated on: ${formatDate(this.metric.lastUpdated, "MM-dd-yyyy")}`,
      );
    }

    return filtersStrings.join(";\n").concat("\n");
  }

  get filtersDescription(): string {
    return this.describeFilters();
  }

  /**
   * Returns the chart header for a chart that covers one part of a compound
   * filter value, such as one custody status. A selected option that names a
   * different part is left out, so the header lists only what the chart can
   * show. An option with a plain value always stays.
   */
  getFiltersDescriptionForCompoundValuePart(part: string): string {
    return this.describeFilters(
      (option) =>
        !option.value.includes(COMPOUND_FILTER_VALUE_DELIMITER) ||
        splitCompoundFilterValue(option.value).includes(part),
    );
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
      ? this.enabledFilterOptionsByTenant[this.pathwaysTenantId]
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
              if (filterType === FILTER_TYPES.DATE_IN_POPULATION) {
                acc[filterType as FilterType].options = dynamicOptions;
                // Default to the most recent date (first option)
                const mostRecent = dynamicOptions[0];
                acc[filterType as FilterType].defaultOption = mostRecent;
                acc[filterType as FilterType].defaultValue = mostRecent.value;
                // Update the active filter value if still set to "ALL"
                const current = get(this.filters, filterType) as string[];
                if (
                  current.length === 1 &&
                  current[0] === "ALL" &&
                  mostRecent
                ) {
                  set(this.filters, filterType, [mostRecent.value]);
                }
              } else {
                acc[filterType as FilterType].options = [
                  { label: "All", value: "ALL" },
                  ...dynamicOptions,
                ];
              }
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
    lastUpdated?: Date;
    isOverTime?: boolean;
    multiSelectFilters?: readonly string[];
  };

  abstract get pathwaysTenantId(): PathwaysTenantId | undefined;

  /**
   * Per-tenant enabled-filter overlays. Each app provides its own map so that
   * product surfaces can diverge between apps (e.g. staff vs public-pathways)
   * without coupling shared-pathways to either app's product decisions.
   */
  abstract get enabledFilterOptionsByTenant(): Partial<
    Record<PathwaysTenantId, Partial<EnabledFiltersByMetric>>
  >;
}
