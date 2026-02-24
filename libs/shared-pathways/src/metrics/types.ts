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

import {
  EnabledFiltersByMetric,
  Filters,
  MetricId,
  MetricRecord,
  NewBackendRecord,
  PopulationFilterValues,
  SimulationCompartment,
} from "../index";

/**
 * Minimal observable store interface that PathwaysNewBackendMetric reads.
 * Staff's CoreStore and future Public Pathways stores implement this.
 */
export interface PathwaysMetricStore {
  readonly filters: PopulationFilterValues;
  readonly filtersStore: {
    readonly enabledFilters: EnabledFiltersByMetric;
    readonly monthRange: number;
  };
  readonly page: string;
  readonly section: string;
  readonly currentTenantId: string | undefined;
}

/**
 * Function that fetches metric data from a backend.
 * Encapsulates auth, URL construction, and retry logic.
 */
export type MetricsFetcher<RecordFormat extends MetricRecord> = (
  endpoint: string,
  queryParams: URLSearchParams,
  signal: AbortSignal,
) => Promise<NewBackendRecord<RecordFormat>>;

/**
 * Predicate that determines whether a metric should hydrate.
 * In staff, this wraps PathwaysMetric.backendForMetric(id) !== "OLD".
 * Defaults to () => true.
 */
export type ShouldHydratePredicate = (metricId: MetricId) => boolean;

export type SharedMetricConstructorOptions<RecordFormat extends MetricRecord> =
  {
    id: MetricId;
    endpoint: string;
    store: PathwaysMetricStore;
    fetchMetrics: MetricsFetcher<RecordFormat>;
    shouldHydrate?: ShouldHydratePredicate;
    filters?: Filters;
    enableMetricModeToggle?: boolean;
    compartment?: SimulationCompartment;
    isHorizontal?: boolean;
    isGeographic?: boolean;
    rotateLabels?: boolean;
    accessorIsNotFilterType?: boolean;
  };
