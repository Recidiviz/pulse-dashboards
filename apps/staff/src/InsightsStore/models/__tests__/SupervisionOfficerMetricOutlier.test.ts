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

import assertNever from "assert-never";
import { shuffle } from "lodash";
import { ValuesType } from "utility-types";

import {
  LOOKBACK_END_DATE_STRINGS,
  LOOKBACK_END_DATES,
} from "../offlineFixtures/constants";
import { InsightsConfigFixture } from "../offlineFixtures/InsightsConfigFixture";
import { rawMetricBenchmarksFixture } from "../offlineFixtures/MetricBenchmarkFixture";
import { rawSupervisionOfficerMetricOutlierFixtures } from "../offlineFixtures/SupervisionOfficerMetricOutlierFixture";
import {
  RawSupervisionOfficerMetricOutlier,
  supervisionOfficerMetricOutlierSchema,
} from "../SupervisionOfficerMetricOutlier";

function forEachOutlierFixture(
  cb: (
    metric: RawSupervisionOfficerMetricOutlier,
    benchmarkData: ValuesType<typeof rawMetricBenchmarksFixture>,
  ) => void,
) {
  Object.entries(rawSupervisionOfficerMetricOutlierFixtures).forEach(
    ([metricId, byCaseloadType]) => {
      Object.entries(byCaseloadType).forEach(([caseloadType, metrics]) => {
        const benchmarkData = rawMetricBenchmarksFixture.find(
          (b) => b.metricId === metricId && b.caseloadType === caseloadType,
        );

        if (!benchmarkData)
          throw new Error("unable to find matching benchmark data");

        // Typescript for some reason has lost track of what this array of metric objects looks like
        metrics.forEach((metric: RawSupervisionOfficerMetricOutlier) => {
          cb(metric, benchmarkData);
        });
      });
    },
  );
}

test("data should be sorted chronologically", () => {
  forEachOutlierFixture((rawMetric) => {
    const shuffledMetric = { ...rawMetric };
    shuffledMetric.statusesOverTime = shuffle(shuffledMetric.statusesOverTime);
    expect(
      supervisionOfficerMetricOutlierSchema
        .parse(shuffledMetric)
        .statusesOverTime.map((s) => s.endDate),
    ).toEqual(
      // not all have to be complete, but all must be chronological up to the latest period
      LOOKBACK_END_DATES.slice(-1 * shuffledMetric.statusesOverTime.length),
    );
  });
});

test("fixture rate values should also appear in benchmark data", () => {
  forEachOutlierFixture((metric, benchmarkData) => {
    expect(benchmarkData.latestPeriodValues.far).toContain(
      metric.statusesOverTime.find(
        (s) => s.endDate === LOOKBACK_END_DATE_STRINGS.at(-1),
      )?.metricRate,
    );
  });
});

test("fixture lookback values should correspond to benchmark ranges", () => {
  forEachOutlierFixture((metric, benchmarkData) => {
    metric.statusesOverTime.forEach((d) => {
      const targetValue = benchmarkData.benchmarks.find(
        (b) => b.endDate === d.endDate,
      )?.target as number;
      const outcomeType = InsightsConfigFixture.metrics.find(
        (c) => metric.metricId === c.name,
      )?.outcomeType;
      expect(targetValue).toBeDefined();
      switch (d.status) {
        case "FAR":
          if (outcomeType === "ADVERSE")
            expect(d.metricRate).toBeGreaterThan(
              Math.max(...benchmarkData.latestPeriodValues.near),
            );
          else
            expect(d.metricRate).toBeLessThan(
              Math.max(...benchmarkData.latestPeriodValues.near),
            );
          break;
        case "NEAR":
          if (outcomeType === "ADVERSE") {
            expect(d.metricRate).toBeGreaterThan(targetValue);
            expect(d.metricRate).toBeLessThan(
              Math.min(...benchmarkData.latestPeriodValues.far),
            );
          } else {
            expect(d.metricRate).toBeLessThan(targetValue);
            expect(d.metricRate).toBeGreaterThan(
              Math.min(...benchmarkData.latestPeriodValues.far),
            );
          }

          break;
        case "MET":
          expect(d.metricRate).toBeLessThanOrEqual(targetValue);
          break;
        default:
          assertNever(d.status);
      }
    });
  });
});
