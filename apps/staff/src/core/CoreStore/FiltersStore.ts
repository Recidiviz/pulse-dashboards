// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
  action,
  computed,
  get,
  keys,
  makeAutoObservable,
  observable,
  reaction,
  set,
  toJS,
} from "mobx";
import { QueryParamConfigMap } from "use-query-params";

import { isDemoMode, isOfflineMode } from "~client-env-utils";

import { US_DEMO } from "../../RootStore/TenantStore/pathwaysTenants";
import { isPathwaysTenantId, PathwaysTenants } from "../../RootStore/types";
import { MonthOptions } from "../PopulationTimeSeriesChart/helpers";
import {
  EnabledFilter,
  EnabledFilters,
  EnabledFiltersByMetric,
  FilterOption,
  Filters,
  FilterType,
  PopulationFilterLabels,
  PopulationFilters,
  PopulationFilterValues,
} from "../types/filters";
import { FILTER_TYPES, filtersOrder } from "../utils/constants";
import enabledFilters from "../utils/enabledFilters";
import filterOptions, {
  defaultMetricMode,
  DefaultPopulationFilterOptions,
  defaultPopulationFilterValues,
  getFilterOptions,
} from "../utils/filterOptions";
import { formatTimePeriodLabel } from "../utils/timePeriod";
import type CoreStore from ".";

export default class FiltersStore {
  rootStore;

  filters: PopulationFilterValues = defaultPopulationFilterValues;

  metricMode: string = defaultMetricMode;

  constructor({ rootStore }: { rootStore: CoreStore }) {
    makeAutoObservable(this, {
      filters: observable,
      timePeriodLabel: computed,
      setFilters: action,
      filterOptions: computed,
    });

    this.rootStore = rootStore;
    this.resetFilters = this.resetFilters.bind(this);
    this.getFilterLabel = this.getFilterLabel.bind(this);
    this.getFilterLongLabel = this.getFilterLongLabel.bind(this);

    reaction(
      () => this.rootStore.metricsStore?.current?.filters,
      (filters: Filters) => {
        this.clearDisabledFilters(filters);
      },
      { delay: 300 },
    );
  }

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
    keys(this.filters).forEach((filterType) => {
      if (
        filterType !== FILTER_TYPES.TIME_PERIOD &&
        // @ts-ignore
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

  get pathwaysTenantId(): PathwaysTenants | undefined {
    if (isPathwaysTenantId(this.rootStore.currentTenantId)) {
      return this.rootStore.currentTenantId;
    }
  }

  get enabledFiltersDefaultQueryString(): QueryParamConfigMap {
    const { current: metric } = this.rootStore.metricsStore;
    const query = {} as QueryParamConfigMap;
    [
      ...metric.filters.enabledFilters,
      ...(metric.filters.enabledMoreFilters ?? []),
    ].forEach((filterType) => {
      query[filterType] = this.filterOptions[
        filterType as keyof PopulationFilters
      ].defaultOption.label as any;
    });
    return query;
  }

  get timePeriodLabel(): string {
    return formatTimePeriodLabel(get(this.filters, "timePeriod"));
  }

  get monthRange(): MonthOptions {
    // the timePeriod filter will only ever be single-select so always use the 0 index
    return parseInt(this.filters.timePeriod[0]) as MonthOptions;
  }

  get filtersDescription(): string {
    const metric = this.rootStore.metricsStore.current;
    const filters = toJS(this.filters);
    const filterKeys = Object.keys(filters) as FilterType[];
    const filtersStrings = filterKeys.reduce((acc: string[], key) => {
      if (
        metric?.filters.enabledFilters.includes(key) ||
        metric?.filters.enabledMoreFilters?.includes(key)
      ) {
        const { title } = this.filterOptions[key];
        acc.push(`${title}: ${this.filtersLabels[key]}`);
      }

      return acc;
    }, []);
    return filtersStrings.join(";\n").concat("\n");
  }

  get currentMetricMode(): string {
    return this.metricMode;
  }

  get filtersLabels(): PopulationFilterLabels {
    return keys(this.filters).reduce((acc, filterType) => {
      const filter =
        this.filterOptions[filterType as keyof PopulationFilterLabels];
      const labels = getFilterOptions(
        this.filters[filter.type] as string[],
        filter.options,
      )
        .map((o) => o.label)
        .join(", ");
      acc[filterType as FilterType] = labels;
      return acc;
    }, {} as PopulationFilterLabels);
  }

  get enabledFilters(): EnabledFiltersByMetric {
    return this.pathwaysTenantId
      ? // @ts-expect-error grandfathered
        enabledFilters[this.pathwaysTenantId]
      : // @ts-expect-error grandfathered
        undefined;
  }

  get sortedFilters(): EnabledFilters {
    const { current: metric } = this.rootStore.metricsStore;

    return filtersOrder.filter((item: EnabledFilter) =>
      metric.filters?.enabledFilters.includes(item),
    );
  }

  get filterOptions(): PopulationFilters {
    const metric = this.rootStore.metricsStore.current;
    const staticFilterOptions = this.pathwaysTenantId
      ? {
          ...filterOptions[
            isDemoMode() || isOfflineMode() ? US_DEMO : this.pathwaysTenantId
          ],
        }
      : DefaultPopulationFilterOptions;

    return metric.hydrationState.status === "hydrated"
      ? Object.entries(metric.dynamicFilterOptions).reduce(
          (acc, [filterType, dynamicOptions]) => {
            acc[filterType as FilterType].options = [
              { label: "All", value: "ALL" },
              ...dynamicOptions,
            ];
            return acc;
          },
          staticFilterOptions,
        )
      : staticFilterOptions;
  }

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
}
