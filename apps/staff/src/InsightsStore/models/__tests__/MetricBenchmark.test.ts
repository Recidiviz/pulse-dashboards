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

import { shuffle } from "lodash";

import { LOOKBACK_END_DATES } from "~datatypes";

import { metricBenchmarkSchema } from "../MetricBenchmark";
import { rawMetricBenchmarksFixture } from "../offlineFixtures/MetricBenchmarkFixture";

test("transformations", () => {
  rawMetricBenchmarksFixture.forEach((b) =>
    expect(metricBenchmarkSchema.parse(b)).toMatchSnapshot(),
  );
});

test("benchmarks should be sorted chronologically", () => {
  rawMetricBenchmarksFixture.forEach((rawBenchmark) => {
    const shuffledBenchmark = { ...rawBenchmark };
    shuffledBenchmark.benchmarks = shuffle(shuffledBenchmark.benchmarks);
    expect(
      metricBenchmarkSchema
        .parse(shuffledBenchmark)
        .benchmarks.map((b) => b.endDate),
    ).toEqual(LOOKBACK_END_DATES);
  });
});

test("caseload type is renamed to caseload category", () => {
  const { caseloadCategory, ...rawFixtureNoCaseloadCategory } =
    rawMetricBenchmarksFixture[0];
  const rawFixtureCaseloadType = {
    caseloadType: caseloadCategory,
    ...rawFixtureNoCaseloadCategory,
  };

  const parsedMetricBenchmark = metricBenchmarkSchema.parse(
    rawFixtureCaseloadType,
  );
  expect(
    Object.prototype.hasOwnProperty.call(parsedMetricBenchmark, "caseloadType"),
  ).toBeFalse();
  expect(
    Object.prototype.hasOwnProperty.call(
      parsedMetricBenchmark,
      "caseloadCategory",
    ),
  ).toBeTrue();
});

test("missing caseload type / category fails parsing", () => {
  const { caseloadCategory, ...rawFixtureNoCaseloadCategory } =
    rawMetricBenchmarksFixture[0];

  expect(() => metricBenchmarkSchema.parse(rawFixtureNoCaseloadCategory))
    .toThrowErrorMatchingInlineSnapshot(`
    [ZodError: [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined",
        "path": [
          "caseloadCategory"
        ],
        "message": "Required"
      }
    ]]
  `);
});
