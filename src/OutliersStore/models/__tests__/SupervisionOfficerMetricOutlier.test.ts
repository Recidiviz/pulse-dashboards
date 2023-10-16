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

import assertNever from "assert-never";
import { ValuesType } from "utility-types";

import { rawMetricBenchmarksFixture } from "../offlineFixtures/MetricBenchmarkFixture";
import { rawSupervisionOfficerMetricOutlierFixtures } from "../offlineFixtures/SupervisionOfficerMetricOutlierFixture";
import { RawSupervisionOfficerMetricOutlier } from "../SupervisionOfficerMetricOutlier";

function forEachOutlierFixture(
  cb: (
    metric: RawSupervisionOfficerMetricOutlier,
    benchmarkData: ValuesType<typeof rawMetricBenchmarksFixture>
  ) => void
) {
  Object.entries(rawSupervisionOfficerMetricOutlierFixtures).forEach(
    ([metricId, byCaseloadType]) => {
      Object.entries(byCaseloadType).forEach(([caseloadType, metrics]) => {
        const benchmarkData = rawMetricBenchmarksFixture.find(
          (b) => b.metricId === metricId && b.caseloadType === caseloadType
        );

        if (!benchmarkData)
          throw new Error("unable to find matching benchmark data");

        // Typescript for some reason has lost track of what this array of metric objects looks like
        metrics.forEach((metric: RawSupervisionOfficerMetricOutlier) => {
          cb(metric, benchmarkData);
        });
      });
    }
  );
}

test("fixture rate values should also appear in benchmark data", () => {
  forEachOutlierFixture((metric, benchmarkData) => {
    expect(benchmarkData.latestPeriodValues.far).toContain(metric.rate);
  });
});

test("fixture lookback values should correspond to benchmark ranges", () => {
  forEachOutlierFixture((metric, benchmarkData) => {
    metric.previousPeriodValues.forEach((d) => {
      const targetValue = benchmarkData.benchmarks.find(
        (b) => b.endDate === d.endDate
      )?.target as number;
      expect(targetValue).toBeDefined();

      switch (d.status) {
        case "FAR":
          expect(d.rate).toBeGreaterThan(
            Math.max(...benchmarkData.latestPeriodValues.near)
          );
          break;
        case "NEAR":
          expect(d.rate).toBeGreaterThan(targetValue);
          expect(d.rate).toBeLessThan(
            Math.min(...benchmarkData.latestPeriodValues.far)
          );
          break;
        case "MET":
          expect(d.rate).toBeLessThanOrEqual(targetValue);
          break;
        default:
          assertNever(d.status);
      }
    });
  });
});
