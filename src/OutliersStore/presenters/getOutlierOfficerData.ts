// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { OutlierOfficerData } from "./types";

/**
 * Collects all of the officer data, modeling relationships between them with nested objects,
 * and verifies that all of the related objects actually exist. It throws an error rather than
 * returning a partial result, to guarantee return values are fully hydrated.
 */
export function getOutlierOfficerData(
  officerData: SupervisionOfficer,
  supervisionStore: OutliersSupervisionStore
): OutlierOfficerData {
  return {
    ...officerData,
    outlierMetrics: officerData.outlierMetrics.map((metric) => {
      // verify that the related objects we need are actually present;
      // specifically, the metric configs for this officer and the benchmarks
      // for their caseload type
      const metricConfig = supervisionStore.metricConfigsById?.get(
        metric.metricId
      );
      if (!metricConfig) {
        throw new Error(`Missing metric configuration for ${metric.metricId}`);
      }

      const metricBenchmarks = metricConfig.metricBenchmarksByCaseloadType;
      if (!metricBenchmarks) {
        throw new Error(`Missing metric benchmark data for ${metric.metricId}`);
      }

      const caseloadType = officerData?.caseloadType || "ALL";
      const benchmark = metricBenchmarks.get(caseloadType);
      if (!benchmark) {
        throw new Error(
          `Missing metric benchmark data for caseload type ${caseloadType} for ${metric.metricId}`
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
        (v) => v.value === currentPeriodData.metricRate
      );
      // in practice we always expect a match,
      // but if we miss we don't want to arbitrarily delete the last element
      if (matchingIndex > -1) {
        filteredBenchmark.latestPeriodValues.splice(matchingIndex, 1);
      }

      const config: Optional<MetricConfig, "metricBenchmarksByCaseloadType"> = {
        ...metricConfig,
      };
      delete config.metricBenchmarksByCaseloadType;

      return {
        ...metric,
        benchmark: filteredBenchmark,
        config,
        currentPeriodData,
      };
    }),
  };
}
