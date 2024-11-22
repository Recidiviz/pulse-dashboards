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

import { compact } from "lodash/fp";
import { Optional } from "utility-types";

import {
  ExcludedSupervisionOfficer,
  excludedSupervisionOfficerSchema,
  MetricConfig,
  SupervisionOfficer,
  supervisionOfficerSchema,
  VITALS_METRIC_IDS,
} from "~datatypes";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { HighlightedOfficersDetail, OutlierOfficerData } from "./types";

export const THIRTY_SECONDS = 1000 * 30;
export const TEN_SECONDS = 1000 * 10;

export function isExcludedSupervisionOfficer(
  officerData: object | undefined,
): officerData is ExcludedSupervisionOfficer {
  return (
    excludedSupervisionOfficerSchema.safeParse(officerData).success &&
    !supervisionOfficerSchema.safeParse(officerData).success
  );
}

/**
 * Collects all of the officer data, modeling relationships between them with nested objects,
 * and verifies that all of the related objects actually exist. It throws an error rather than
 * returning a partial result, to guarantee return values are fully hydrated.
 */
export function getOutlierOfficerData<
  T extends SupervisionOfficer | ExcludedSupervisionOfficer,
>(
  officer: T,
  supervisionStore: InsightsSupervisionStore,
): OutlierOfficerData<T> {
  if (isExcludedSupervisionOfficer(officer))
    return officer as OutlierOfficerData<T>;

  const officerData = officer as SupervisionOfficer;

  return {
    ...officerData,
    caseloadCategoryName: officerData.caseloadCategory
      ? supervisionStore.caseloadCategoryDisplayName(
          officerData.caseloadCategory,
        )
      : undefined,
    outlierMetrics: officerData.outlierMetrics.map((metric) => {
      // verify that the related objects we need are actually present;
      // specifically, the metric configs for this officer and the benchmarks
      // for their caseload type
      const metricConfig = supervisionStore.metricConfigsById?.get(
        metric.metricId,
      );
      if (!metricConfig) {
        throw new Error(`Missing metric configuration for ${metric.metricId}`);
      }

      const metricBenchmarks = metricConfig.metricBenchmarksByCaseloadCategory;
      if (!metricBenchmarks) {
        throw new Error(`Missing metric benchmark data for ${metric.metricId}`);
      }

      const caseloadCategory = officerData.caseloadCategory || "ALL";
      const benchmark = metricBenchmarks.get(caseloadCategory);
      if (!benchmark) {
        throw new Error(
          `Missing metric benchmark data for caseload type ${caseloadCategory} for ${metric.metricId}`,
        );
      }

      const currentPeriodData =
        metric.statusesOverTime[metric.statusesOverTime.length - 1];
      const currentPeriodTarget =
        benchmark.benchmarks[benchmark.benchmarks.length - 1].target;

      // current officer's rate is duplicated in the benchmark values, so we need to remove it
      const filteredBenchmark = { ...benchmark, currentPeriodTarget };
      // making a shallow copy of the array so we don't mutate the one from the datastore
      filteredBenchmark.latestPeriodValues = [
        ...filteredBenchmark.latestPeriodValues,
      ];
      const matchingIndex = filteredBenchmark.latestPeriodValues.findIndex(
        (v) => v.value === currentPeriodData.metricRate,
      );
      // in practice we always expect a match,
      // but if we miss we don't want to arbitrarily delete the last element
      if (matchingIndex > -1) {
        filteredBenchmark.latestPeriodValues.splice(matchingIndex, 1);
      }

      const config: Optional<
        MetricConfig,
        "metricBenchmarksByCaseloadCategory"
      > = {
        ...metricConfig,
      };
      delete config.metricBenchmarksByCaseloadCategory;

      return {
        ...metric,
        benchmark: filteredBenchmark,
        config,
        currentPeriodData,
      };
    }),
  } as OutlierOfficerData<T>;
}

export function getLocationWithoutLabel(
  location: string | null | undefined,
  label: string,
): string | undefined {
  return location?.toUpperCase().startsWith(label.toUpperCase())
    ? location.toUpperCase().split(`${label.toUpperCase()} `)[1]
    : location ?? undefined;
}

// TODO #34616 Use Label from config once it is ready
export const labelForVitalsMetricId = (metricId: string): string => {
  return metricId === VITALS_METRIC_IDS.enum.timely_contact
    ? "F2F Contact"
    : "Timely Risk Assessment";
};

export function getHighlightedOfficersByMetric(
  metricConfigs: Map<string, MetricConfig> | undefined,
  officers: SupervisionOfficer[] | undefined,
): HighlightedOfficersDetail[] {
  if (!metricConfigs) return [];
  const metricsToHighlight = Array.from(metricConfigs.values()).filter(
    (m) => !!m.topXPct,
  );
  return compact(
    metricsToHighlight.map((m) => {
      const highlightedOfficers =
        officers?.filter((o) =>
          o.topXPctMetrics?.map((t) => t.metricId).includes(m.name),
        ) || [];
      if (highlightedOfficers.length > 0) {
        return {
          metricName: m.eventName,
          officers: highlightedOfficers.map((o) => ({
            pseudonymizedId: o.pseudonymizedId,
            displayName: o.displayName,
          })),
          numOfficers: highlightedOfficers.length,
          topXPct: m.topXPct,
        };
      }
      return;
    }),
  );
}
