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
  action,
  comparer,
  makeObservable,
  observable,
  reaction,
  runInAction,
  toJS,
} from "mobx";

import { callNewMetricsApi } from "../../api/metrics/metricsClient";
import RootStore from "../../RootStore";
import { TenantId } from "../../RootStore/types";
import { isDemoMode } from "../../utils/isDemoMode";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { getMethodologyCopy, getMetricCopy } from "../content";
import { MetricContent, PageContent } from "../content/types";
import CoreStore from "../CoreStore";
import { Filters, PopulationFilterValues } from "../types/filters";
import { isAbortException } from "../utils/exceptions";
import {
  getMetricIdsForPage,
  getSectionIdForMetric,
  PATHWAYS_PAGES,
  PathwaysPage,
} from "../views";
import PathwaysMetric from "./PathwaysMetric";
import {
  HydratablePathwaysMetric,
  MetricId,
  MetricRecord,
  NewBackendRecord,
  PathwaysMetricRecords,
  SimulationCompartment,
} from "./types";
import { formatDateString, getTimePeriodRawValue } from "./utils";

export type BaseNewMetricConstructorOptions = {
  id: MetricId;
  endpoint: string;
  rootStore: CoreStore;
  filters?: Filters;
  enableMetricModeToggle?: boolean;
  compartment?: SimulationCompartment;
  isHorizontal?: boolean;
  isGeographic?: boolean;
  rotateLabels?: boolean;
  accessorIsNotFilterType?: boolean;
};

export default abstract class PathwaysNewBackendMetric<
  RecordFormat extends MetricRecord
> implements HydratablePathwaysMetric
{
  readonly id: MetricId;

  readonly endpoint: string;

  readonly rootStore: CoreStore;

  readonly filters: Filters;

  readonly enableMetricModeToggle: boolean;

  readonly isHorizontal: boolean;

  readonly isGeographic: boolean;

  readonly rotateLabels: boolean;

  readonly accessorIsNotFilterType: boolean;

  isLoading?: boolean;

  isHydrated = false;

  protected allRecords?: RecordFormat[];

  // this is just a noop stub method to be overridden when needed
  // eslint-disable-next-line class-methods-use-this
  protected dataTransformer: (d: RecordFormat[]) => RecordFormat[] = (
    d: RecordFormat[]
  ) => {
    return d;
  };

  error?: Error;

  lastUpdated?: Date;

  protected abortController?: AbortController;

  constructor({
    id,
    endpoint,
    rootStore,
    filters,
    enableMetricModeToggle = false,
    isHorizontal = false,
    isGeographic = false,
    rotateLabels = false,
    accessorIsNotFilterType = false,
  }: BaseNewMetricConstructorOptions) {
    this.id = id;
    this.endpoint = endpoint;
    this.rootStore = rootStore;
    this.filters = filters ?? rootStore.filtersStore.enabledFilters[id];
    this.enableMetricModeToggle = enableMetricModeToggle;
    this.isHorizontal = isHorizontal;
    this.isGeographic = isGeographic;
    this.rotateLabels = rotateLabels;
    this.accessorIsNotFilterType = accessorIsNotFilterType;

    makeObservable<PathwaysNewBackendMetric<RecordFormat>, "allRecords">(this, {
      allRecords: observable.ref,
      error: observable,
      hydrate: action,
      isLoading: observable,
      isHydrated: observable,
    });

    reaction(
      () => {
        // Use toJS to ensure we access all the values of the filters. Reactions are only triggered
        // if data was accessed in the data function (this one), and so just returning
        // this.rootStore?.filters isn't enough to track a change to a property of filters.
        return {
          filters: toJS(this.rootStore.filters),
          tenant: this.rootStore.currentTenantId,
        };
      },
      () => {
        // Don't rehydrate the metric if we are not currently viewing it. Instead, clear its
        // hydration status so that the loading bar is displayed the next time we navigate to it.
        if (!this.isCurrentlyViewedMetric) {
          runInAction(() => {
            this.isHydrated = false;
          });
          return;
        }
        this.hydrate();
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

  get isCurrentlyViewedMetric(): boolean {
    const { page, section } = this.rootStore;
    return (
      Object.keys(PATHWAYS_PAGES).includes(page) &&
      getMetricIdsForPage(page as PathwaysPage).includes(this.id) &&
      getSectionIdForMetric(this.id) === section
    );
  }

  getQueryParams(): URLSearchParams {
    const queryParams = new URLSearchParams();
    if (!this.rootStore) {
      return queryParams;
    }
    const filterValues = this.rootStore.filters;

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

  abstract get dataSeries(): PathwaysMetricRecords;

  abstract get dataSeriesForDiffing(): RecordFormat[];

  abstract get isEmpty(): boolean;

  get tenantId(): TenantId | undefined {
    return isOfflineMode() || isDemoMode()
      ? undefined
      : this.rootStore.currentTenantId;
  }

  get content(): MetricContent {
    return getMetricCopy(this.tenantId)[this.id];
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
    if (!this.tenantId) return [];
    const methodology = getMethodologyCopy(this.tenantId).system;
    if (!methodology?.metricCopy || !methodology?.pageCopy) return [];

    return [
      methodology.pageCopy[this.rootStore.page as PathwaysPage],
      methodology.metricCopy[this.id],
    ];
  }

  protected async fetchNewMetrics(
    params: URLSearchParams
  ): Promise<NewBackendRecord<RecordFormat>> {
    // This could abort requests that have already completed, but that's not a big deal.
    this.abortController?.abort();
    this.abortController = new AbortController();

    const stateCode = isOfflineMode() || isDemoMode() ? "US_OZ" : this.tenantId;
    return callNewMetricsApi(
      `${stateCode}/${this.endpoint}?${params.toString()}`,
      RootStore.getTokenSilently,
      this.abortController.signal
    );
  }

  /**
   * Fetches metric data and stores the result reactively on this Metric instance.
   */
  async hydrate(): Promise<void> {
    if (PathwaysMetric.backendForMetric(this.id) === "OLD") {
      return Promise.resolve();
    }
    this.isLoading = true;
    this.error = undefined;
    this.fetchNewMetrics(this.getQueryParams())
      .then((fetchedData) => {
        runInAction(() => {
          this.allRecords = this.dataTransformer(fetchedData.data);
          this.lastUpdated = formatDateString(
            fetchedData.metadata?.lastUpdated
          );
          this.isLoading = false;
          this.isHydrated = true;
        });
      })
      .catch((e) => {
        // Just ignore abort exceptions because it means there is another request active.
        // This needs to be checked here rather than in fetchNewMetrics, otherwise the empty data
        // from the aborted request could override the actual data we want.
        if (!isAbortException(e)) {
          runInAction(() => {
            this.isLoading = false;
            this.error = e;
            this.isHydrated = false;
          });
        }
      });
  }

  get records(): RecordFormat[] | undefined {
    return this.allRecords;
  }
}
