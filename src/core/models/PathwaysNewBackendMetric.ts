// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { snakeCase } from "lodash";
import {
  comparer,
  makeObservable,
  override,
  reaction,
  runInAction,
  toJS,
} from "mobx";

import { callNewMetricsApi } from "../../api/metrics/metricsClient";
import RootStore from "../../RootStore";
import { PopulationFilterValues } from "../types/filters";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import { MetricRecord, NewBackendRecord } from "./types";
import { formatDateString, getTimePeriodRawValue } from "./utils";

export default abstract class PathwaysNewBackendMetric<
  RecordFormat extends MetricRecord
> extends PathwaysMetric<RecordFormat> {
  lastUpdated?: Date;

  constructor({
    rootStore,
    id,
    tenantId,
    sourceFilename,
    dataTransformer,
    filters,
    enableMetricModeToggle,
    compartment,
    hasTimePeriodDimension,
    isHorizontal,
    isGeographic,
    rotateLabels,
    accessorIsNotFilterType,
    endpoint,
  }: BaseMetricConstructorOptions<RecordFormat>) {
    super({
      rootStore,
      id,
      tenantId,
      sourceFilename,
      dataTransformer,
      filters,
      enableMetricModeToggle,
      compartment,
      hasTimePeriodDimension,
      isHorizontal,
      isGeographic,
      rotateLabels,
      accessorIsNotFilterType,
      endpoint,
    });
    makeObservable(this, {
      hydrate: override,
    });

    reaction(
      () => {
        // Use toJS to ensure we access all the values of the filters. Reactions are only triggered
        // if data was accessed in the data function (this one), and so just returning
        // this.rootStore?.filters isn't enough to track a change to a property of filters.
        return toJS(this.rootStore?.filters);
      },
      () => {
        if (
          !this.rootStore ||
          !this.endpoint ||
          // Update the data in allRecords when a filter changes, but only after allRecords has been
          // read the first time.
          !this.isHydrated ||
          process.env.REACT_APP_DEPLOY_ENV === "production"
        )
          return;

        this.fetchNewMetrics(this.getQueryParams()).then((results) => {
          runInAction(() => {
            this.allRecords = results.data;
            this.lastUpdated = formatDateString(results.metadata?.lastUpdated);
          });
        });
      },
      {
        // Use a structural comparison instead of the default '==='. This actually compares the
        // values of the filters, and ensures that if a user clicks on the filter value that's
        // already selected, we don't make another API call (because the comparer will return false,
        // so the reaction won't be entered).
        // This solves a different problem than the toJS call above! The above one solves the
        // problem where we always think things are equal because we aren't seeing changes to filter
        // values at all. This one solves the problem where we always think things are different
        // because two objects with all the same properties don't compare as equal with ===.
        equals: comparer.structural,
      }
    );
  }

  get isHydrated(): boolean {
    return this.isLoading === false && this.error === undefined;
  }

  getQueryParams(): URLSearchParams {
    const queryParams = new URLSearchParams();
    if (!this.rootStore) {
      return queryParams;
    }
    const groupBy = snakeCase(this.groupBy);
    const filterValues = this.rootStore.filters;

    if (groupBy) {
      queryParams.append("group", groupBy);
    }

    this.filters.enabledFilters.forEach((filter) => {
      const key = filter as keyof PopulationFilterValues;
      const values = filterValues[key];
      const queryKey = snakeCase(key);
      if (values) {
        values.forEach((val: any) => {
          if (queryKey === "time_period") {
            const timePeriod = getTimePeriodRawValue(val);
            if (timePeriod) {
              queryParams.append(`filters[${queryKey}]`, timePeriod);
            }
          } else if (val !== "ALL") {
            queryParams.append(`filters[${queryKey}]`, val);
          }
        });
      }
    });
    return queryParams;
  }

  abstract get dataSeriesForDiffing(): RecordFormat[];

  protected async fetchNewMetrics(
    params: URLSearchParams
  ): Promise<NewBackendRecord<RecordFormat>> {
    return this.endpoint &&
      process.env.REACT_APP_DEPLOY_ENV !== "production" &&
      process.env.REACT_APP_NEW_BACKEND_API_URL
      ? callNewMetricsApi(
          `${this.tenantId}/${this.endpoint}?${params.toString()}`,
          RootStore.getTokenSilently
        )
      : Promise.resolve({});
  }

  /**
   * Fetches metric data and stores the result reactively on this Metric instance.
   */
  async hydrate(): Promise<void> {
    this.isLoading = true;
    this.error = undefined;
    this.fetchNewMetrics(this.getQueryParams())
      .then((fetchedData) => {
        runInAction(() => {
          this.allRecords = fetchedData.data;
          this.lastUpdated = formatDateString(
            fetchedData.metadata?.lastUpdated
          );
          this.isLoading = false;
        });
      })
      .catch((e) => {
        this.isLoading = false;
        this.error = e;
      });
  }
}
