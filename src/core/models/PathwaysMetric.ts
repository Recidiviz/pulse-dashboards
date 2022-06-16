// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import * as Sentry from "@sentry/react";
import { startOfMonth, subMonths } from "date-fns";
import { snakeCase } from "lodash";
import {
  action,
  autorun,
  get,
  makeObservable,
  observable,
  runInAction,
  toJS,
} from "mobx";

import { parseResponseByFileFormat } from "../../api/metrics";
import {
  callMetricsApi,
  callNewMetricsApi,
} from "../../api/metrics/metricsClient";
import { ERROR_MESSAGES } from "../../constants/errorMessages";
import RootStore from "../../RootStore";
import { formatDate } from "../../utils";
import { getMethodologyCopy, getMetricCopy } from "../content";
import { MetricContent, PageContent } from "../content/types";
import CoreStore from "../CoreStore";
import { Dimension } from "../types/dimensions";
import {
  EnabledFilters,
  Filters,
  PopulationFilterValues,
} from "../types/filters";
import { PathwaysPage } from "../views";
import { Differ } from "./backendDiff/Differ";
import { DiffError } from "./backendDiff/DiffError";
import { dimensionsByMetricType } from "./dimensions";
import {
  Hydratable,
  MetricId,
  MetricRecord,
  PathwaysMetricRecords,
  RawMetricData,
  SimulationCompartment,
  TenantId,
} from "./types";

export type BaseMetricConstructorOptions<RecordFormat extends MetricRecord> = {
  id: MetricId;
  sourceFilename: string;
  dataTransformer: (d: RawMetricData, f: EnabledFilters) => RecordFormat[];
  filters: Filters;
  tenantId?: TenantId;
  rootStore?: CoreStore;
  enableMetricModeToggle?: boolean;
  compartment?: SimulationCompartment;
  hasTimePeriodDimension?: boolean;
};

/**
 * Represents a single dataset backed by our metrics API,
 * plus any applicable metadata.
 * This is an abstract class that cannot be instantiated directly!
 * See subclasses that narrow this base down to a specific metric format.
 * The preferred way to instantiate `Metric` subclasses is in the
 * MetricsStore.
 */
export default abstract class PathwaysMetric<RecordFormat extends MetricRecord>
  implements Hydratable {
  rootStore?: CoreStore;

  id: MetricId;

  readonly tenantId?: TenantId;

  // data properties
  protected readonly sourceFilename: string;

  protected dataTransformer: (
    d: RawMetricData,
    f: EnabledFilters
  ) => RecordFormat[];

  eagerExpand: boolean;

  isLoading?: boolean;

  protected allRecords?: RecordFormat[];

  error?: Error;

  filters: Filters;

  dimensions: Dimension[];

  enableMetricModeToggle?: boolean = false;

  compartment?: SimulationCompartment;

  hasTimePeriodDimension?: boolean = false;

  endpoint?: string;

  groupBy?: string;

  differ?: Differ<any, any>; // not super great but the differs are temporary anyway

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
  }: BaseMetricConstructorOptions<RecordFormat>) {
    makeObservable<PathwaysMetric<RecordFormat>, "allRecords">(this, {
      allRecords: observable.ref,
      error: observable,
      hydrate: action,
      isLoading: observable,
    });

    this.rootStore = rootStore;
    this.id = id;
    this.tenantId = tenantId;
    this.sourceFilename = sourceFilename;
    this.dataTransformer = dataTransformer;
    this.eagerExpand = true;
    this.filters = filters;
    this.dimensions = dimensionsByMetricType[this.sourceFilename];
    this.enableMetricModeToggle = enableMetricModeToggle;
    this.compartment = compartment;
    this.hasTimePeriodDimension = hasTimePeriodDimension;

    autorun(() => {
      if (
        !this.rootStore ||
        !this.allRecords?.length ||
        !this.groupBy ||
        !this.endpoint ||
        process.env.REACT_APP_DEPLOY_ENV === "production"
      )
        return;
      const groupBy = snakeCase(this.groupBy);
      const filterValues = this.rootStore.filtersStore.filters;
      const { monthRange } = this.rootStore.filtersStore;
      const queryParams = new URLSearchParams({ group: groupBy });
      if (monthRange) {
        const since = startOfMonth(subMonths(new Date(), monthRange));
        queryParams.append("since", formatDate(since, "yyyy-MM-dd"));
      }

      this.dimensions.forEach((dimension) => {
        const key = dimension as keyof PopulationFilterValues;
        const values = toJS(get(filterValues, key));
        const queryKey = snakeCase(key);
        if (values) {
          values.forEach((val: any) => {
            if (val !== "ALL") {
              queryParams.append(`filters[${queryKey}]`, val);
            }
          });
        }
      });

      this.fetchNewMetrics(queryParams).then((results) => {
        if (this.differ) {
          const diffs = this.differ.diff(this.dataSeries, results);
          if (diffs.size > 0) {
            Sentry.captureException(
              new DiffError(JSON.stringify(Object.fromEntries(diffs)))
            );
          }
        }
      });
    });
  }

  abstract get dataSeries(): PathwaysMetricRecords;

  get content(): MetricContent {
    return getMetricCopy(this.rootStore?.currentTenantId)[this.id];
  }

  get chartTitle(): string {
    return this.content.title;
  }

  /**
   * Returns the note copy, unformatted. Child metric classes can override this
   * function and format the note if necessary.
   */
  get note(): string | undefined {
    return this.content.note;
  }

  get chartXAxisTitle(): string | undefined {
    return this.content.chartXAxisTitle;
  }

  get chartYAxisTitle(): string | undefined {
    return this.content.chartYAxisTitle;
  }

  /**
   * Returns the methodology copy specific to this metric.
   * Page methodology + metric methodology.
   */
  get methodology(): (PageContent | MetricContent)[] {
    if (!this.rootStore?.currentTenantId) return [];
    const methodology = getMethodologyCopy(this.rootStore.currentTenantId)
      .system;
    if (!methodology?.metricCopy || !methodology?.pageCopy) return [];

    return [
      methodology.pageCopy[this.rootStore.page as PathwaysPage],
      methodology.metricCopy[this.id],
    ];
  }

  /**
   * Fetches metric data and stores the result reactively on this Metric instance.
   */
  async hydrate(): Promise<void> {
    this.isLoading = true;
    try {
      const fetchedData = await this.fetchAndTransform();
      runInAction(() => {
        this.allRecords = fetchedData;
        this.isLoading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.isLoading = false;
        this.error = e;
      });
    }
  }

  /**
   * Implements the standard retrieval for a single metric:
   * fetches one metric, applies a transformation function to it,
   * and throws an error if no data could be fetched.
   */
  protected async fetchAndTransform(): Promise<RecordFormat[]> {
    const apiResponse = await this.fetchMetrics();
    if (apiResponse[this.sourceFilename]) {
      const parsedData = parseResponseByFileFormat(
        apiResponse,
        this.sourceFilename,
        this.eagerExpand
      );
      return this.dataTransformer(
        parsedData.data,
        // TODO #1511 remove this concat once all filters are under single key
        this.filters.enabledFilters.concat(
          this.filters.enabledMoreFilters || []
        )
      );
    }
    throw new Error(ERROR_MESSAGES.noMetricData);
  }

  /**
   * Fetches the metric data from the server.
   */
  protected async fetchMetrics(): Promise<Record<string, RawMetricData>> {
    const endpoint = `${this.tenantId}/pathways/${this.sourceFilename}`.toLowerCase();
    return callMetricsApi(endpoint, RootStore.getTokenSilently);
  }

  protected async fetchNewMetrics(
    params: URLSearchParams
  ): Promise<RecordFormat[]> {
    return this.endpoint &&
      process.env.REACT_APP_DEPLOY_ENV !== "production" &&
      process.env.REACT_APP_NEW_BACKEND_API_URL
      ? callNewMetricsApi(
          `${this.tenantId}/${this.endpoint}?${params.toString()}`,
          RootStore.getTokenSilently
        )
      : Promise.resolve([]);
  }

  get records(): RecordFormat[] | undefined {
    return this.allRecords;
  }
}
