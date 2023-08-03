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
import {
  action,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";

import { parseResponseByFileFormat } from "../../api/metrics";
import { callMetricsApi } from "../../api/metrics/metricsClient";
import { ERROR_MESSAGES } from "../../constants/errorMessages";
import flags from "../../flags";
import RootStore from "../../RootStore";
import { TenantId } from "../../RootStore/types";
import { getMethodologyCopy, getMetricCopy } from "../content";
import { MetricContent, PageContent } from "../content/types";
import CoreStore from "../CoreStore";
import { Dimension } from "../types/dimensions";
import { EnabledFilters, Filters } from "../types/filters";
import { PathwaysPage } from "../views";
import { Diff, Differ } from "./backendDiff/Differ";
import { DiffError } from "./backendDiff/DiffError";
import { dimensionsByMetricType } from "./dimensions";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import {
  HydratablePathwaysMetric,
  MetricId,
  MetricRecord,
  PathwaysMetricRecords,
  RawMetricData,
  SimulationCompartment,
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
  isHorizontal?: boolean;
  isGeographic?: boolean;
  rotateLabels?: boolean;
  accessorIsNotFilterType?: boolean;
  newBackendMetric?: PathwaysNewBackendMetric<any>;
};

type metricBackend = "OLD" | "OLD_WITH_DIFFING" | "NEW";

/**
 * Represents a single dataset backed by our metrics API,
 * plus any applicable metadata.
 * This is an abstract class that cannot be instantiated directly!
 * See subclasses that narrow this base down to a specific metric format.
 * The preferred way to instantiate `Metric` subclasses is in the
 * MetricsStore.
 */
export default abstract class PathwaysMetric<RecordFormat extends MetricRecord>
  implements HydratablePathwaysMetric
{
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

  isHydrated = false;

  protected allRecords?: RecordFormat[];

  error?: Error;

  filters: Filters;

  dimensions: Dimension[];

  enableMetricModeToggle?: boolean = false;

  compartment?: SimulationCompartment;

  hasTimePeriodDimension?: boolean = false;

  isHorizontal?: boolean = false;

  isGeographic?: boolean = false;

  rotateLabels?: boolean = false;

  accessorIsNotFilterType?: boolean = false;

  differ?: Differ<any, any>; // <any, any> isn't super great but the differs are temporary anyway

  newBackendMetric?: PathwaysNewBackendMetric<any>;

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
    newBackendMetric,
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
    this.isHorizontal = isHorizontal;
    this.isGeographic = isGeographic;
    this.rotateLabels = rotateLabels;
    this.accessorIsNotFilterType = accessorIsNotFilterType;
    this.newBackendMetric = newBackendMetric;

    reaction(
      () => {
        return this.newBackendMetric?.records;
      },
      () => {
        if (
          !this.rootStore ||
          !this.newBackendMetric ||
          PathwaysMetric.backendForMetric(this.id) !== "OLD_WITH_DIFFING" ||
          process.env.REACT_APP_DEPLOY_ENV === "production"
        )
          return;

        if (this.diffs && this.diffs.totalDiffs > 0) {
          Sentry.captureException(
            new DiffError(
              `${this.diffs.totalDiffs} diffs: ${JSON.stringify(
                Object.fromEntries(this.diffs.samples)
              )}`
            )
          );
        }
      }
    );
  }

  static backendForMetric(metricName: MetricId): metricBackend {
    const overrides = flags.metricBackendOverrides as unknown as Record<
      MetricId,
      metricBackend
    >;
    const defaultBackend =
      (flags.defaultMetricBackend as metricBackend) ?? "OLD";
    if (overrides) {
      return overrides[metricName] ?? defaultBackend;
    }
    return defaultBackend;
  }

  get diffs(): Diff<any> | undefined {
    return this.differ?.diff(
      this.dataSeries,
      this.newBackendMetric?.dataSeriesForDiffing
    );
  }

  abstract get dataSeries(): PathwaysMetricRecords;

  get isEmpty(): boolean {
    return this.dataSeries && this.dataSeries.length < 1;
  }

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
    const methodology = getMethodologyCopy(
      this.rootStore.currentTenantId
    ).system;
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
        this.isHydrated = true;
        this.newBackendMetric?.hydrate();
      });
    } catch (e) {
      runInAction(() => {
        this.isLoading = false;
        this.error = e instanceof Error ? e : new Error(`${e}`);
        this.isHydrated = false;
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
    const endpoint =
      `${this.tenantId}/pathways/${this.sourceFilename}`.toLowerCase();
    return callMetricsApi(endpoint, RootStore.getTokenSilently);
  }

  get records(): RecordFormat[] | undefined {
    return this.allRecords;
  }
}
