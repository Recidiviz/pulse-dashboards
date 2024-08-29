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

import { Optional } from "utility-types";

import { MetricConfig } from "../models/MetricConfig";
import {
  ExcludedSupervisionOfficer,
  excludedSupervisionOfficerSchema,
  SupervisionOfficer,
  supervisionOfficerSchema,
} from "../models/SupervisionOfficer";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { OutlierOfficerData } from "./types";

export const THIRTY_SECONDS = 1000 * 30;

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

export function getDistrictWithoutLabel(
  district: string | null | undefined,
  label: string,
): string | undefined {
  return district?.toUpperCase().startsWith(label.toUpperCase())
    ? district.toUpperCase().split(`${label.toUpperCase()} `)[1]
    : district ?? undefined;
}
