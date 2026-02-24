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

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import {
  Filters,
  MetricId,
  MetricRecord,
  SharedMetricConstructorOptions,
  SimulationCompartment,
} from "~shared-pathways";

import { callNewMetricsApi } from "../../api/metrics/metricsClient";
import RootStore from "../../RootStore";
import CoreStore from "../CoreStore";
import PathwaysMetric from "./PathwaysMetric";

export type BaseNewMetricConstructorProps = {
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

/**
 * Translates staff-specific constructor options into the shared-pathways
 * SharedMetricConstructorOptions by injecting the fetch adapter and
 * shouldHydrate predicate.
 */
export function generateStaffNewMetricOptions<
  RecordFormat extends MetricRecord,
>(
  opts: BaseNewMetricConstructorProps,
): SharedMetricConstructorOptions<RecordFormat> {
  const { rootStore, ...rest } = opts;
  return {
    ...rest,
    store: rootStore,
    fetchMetrics: (endpoint, params, signal) => {
      const stateCode =
        isOfflineMode() || isDemoMode() ? "US_OZ" : rootStore.currentTenantId;
      return callNewMetricsApi(
        `pathways/${stateCode}/${endpoint}?${params.toString()}`,
        RootStore.getTokenSilently,
        signal,
      );
    },
    shouldHydrate: (id) => PathwaysMetric.backendForMetric(id) !== "OLD",
  };
}
