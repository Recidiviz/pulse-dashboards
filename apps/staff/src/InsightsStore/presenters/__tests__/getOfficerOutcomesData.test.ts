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

import { cloneDeep, omit } from "lodash";
import { flowResult } from "mobx";

import {
  ADVERSE_METRIC_IDS,
  CASELOAD_CATEGORY_IDS,
  InsightsConfigFixture,
  metricBenchmarksFixture,
  SupervisionOfficer,
  supervisionOfficerFixture,
  SupervisionOfficerOutcomes,
  supervisionOfficerOutcomesFixture,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { getOfficerOutcomesData, isExcludedSupervisionOfficer } from "../utils";

let includedInOutcomesOfficer: SupervisionOfficer;
let supervisionStore: InsightsSupervisionStore;
let officerOutcomes: SupervisionOfficerOutcomes;

beforeEach(() => {
  vi.restoreAllMocks();

  [, , includedInOutcomesOfficer] = supervisionOfficerFixture;
  [, , officerOutcomes] = supervisionOfficerOutcomesFixture;
  supervisionStore = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );
});

test("combines related data from outcomes object", async () => {
  await flowResult(supervisionStore.populateMetricConfigs());
  const actual = getOfficerOutcomesData(
    includedInOutcomesOfficer,
    supervisionStore,
    officerOutcomes,
  );

  // Contains officer fields
  expect(actual).toEqual(
    expect.objectContaining(omit(includedInOutcomesOfficer, "outlierMetrics")),
  );

  // Contains outcomes fields
  expect(actual).toContainKeys(Object.keys(officerOutcomes));

  // Successfully transformed metric information to metrics with configs
  actual.outlierMetrics?.forEach((om, i) => {
    expect(om).toEqual(
      expect.objectContaining({
        ...officerOutcomes.outlierMetrics[i],
        benchmark: expect.anything(),
        config: expect.anything(),
        currentPeriodData: expect.anything(),
      }),
    );
  });
  expect(actual.caseloadCategoryName).toBeDefined();
});

test("excludes current officer from the benchmark data points", async () => {
  // injecting a duplicate value into the benchmark data so we can verify it doesn't get clobbered;
  // this is really more relevant to the favorable metrics that tend to skew towards zero,
  // but it is equally valid for all metrics
  const benchmarks = cloneDeep(metricBenchmarksFixture);
  const outlierMetric = officerOutcomes.outlierMetrics[0];
  const matchingBenchmarkForOfficer = benchmarks.find(
    (b) =>
      b.caseloadCategory === officerOutcomes.caseloadCategory &&
      b.metricId === outlierMetric.metricId,
  );

  if (!matchingBenchmarkForOfficer)
    throw new Error("unable to mock benchmark data");

  const currentOutlierRate = outlierMetric?.statusesOverTime.at(-1)
    ?.metricRate as number;

  matchingBenchmarkForOfficer.latestPeriodValues.push({
    targetStatus: "FAR",
    value: currentOutlierRate,
  });
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "metricBenchmarks",
  ).mockResolvedValue(benchmarks);

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(
    supervisionStore.metricConfigsById
      ?.get(matchingBenchmarkForOfficer.metricId)
      ?.metricBenchmarksByCaseloadCategory?.get(
        matchingBenchmarkForOfficer.caseloadCategory,
      )
      ?.latestPeriodValues.filter((d) => d.value === currentOutlierRate),
  ).toHaveLength(2);

  const outlierData = getOfficerOutcomesData(
    includedInOutcomesOfficer,
    supervisionStore,
    officerOutcomes,
  );

  expect(
    outlierData?.outlierMetrics?.[0].benchmark.latestPeriodValues.filter(
      (d) => d.value === currentOutlierRate,
    ),
  ).toHaveLength(1);
});

test("requires a hydrated store", () => {
  expect(() =>
    getOfficerOutcomesData(
      includedInOutcomesOfficer,
      supervisionStore,
      officerOutcomes,
    ),
  ).toThrow();
});

test("throws on missing config", async () => {
  supervisionStore = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    {
      ...InsightsConfigFixture,
      metrics: InsightsConfigFixture.metrics.slice(1),
    },
  );

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(() =>
    getOfficerOutcomesData(
      includedInOutcomesOfficer,
      supervisionStore,
      officerOutcomes,
    ),
  ).toThrow(
    `Missing metric configuration for ${ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants}`,
  );
});

test("throws if benchmark data was not fully hydrated", async () => {
  // this will be missing all benchmarks for the test metric
  const benchmarks = metricBenchmarksFixture.slice(0, 1);
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "metricBenchmarks",
  ).mockResolvedValue(benchmarks);

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(() =>
    getOfficerOutcomesData(
      includedInOutcomesOfficer,
      supervisionStore,
      officerOutcomes,
    ),
  ).toThrow(
    `Missing metric benchmark data for ${ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants}`,
  );
});

test("throws on missing benchmark for required caseload type", async () => {
  // this will be missing the matching caseload type for the test metric
  const benchmarks = [
    metricBenchmarksFixture[0],
    ...metricBenchmarksFixture.slice(2),
  ];
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "metricBenchmarks",
  ).mockResolvedValue(benchmarks);

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(() =>
    getOfficerOutcomesData(
      includedInOutcomesOfficer,
      supervisionStore,
      officerOutcomes,
    ),
  ).toThrow(
    `Missing metric benchmark data for caseload type ${CASELOAD_CATEGORY_IDS.enum.ALL} for ${ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants}`,
  );
});

describe("when used in a context that expects excluded officers", () => {
  beforeEach(async () => {
    await flowResult(supervisionStore.populateMetricConfigs());
  });

  it("isExcludedOfficer returns false for officers included in outcomes", () => {
    expect(isExcludedSupervisionOfficer(includedInOutcomesOfficer)).toBeFalse();
  });
  it("isExcludedOfficer returns false for undefined", () => {
    expect(isExcludedSupervisionOfficer(undefined)).toBeFalse();
  });
  it("isExcludedOfficer returns true for officer not included in outcomes", () => {
    const officerExcludedFromOutcomes = supervisionOfficerFixture[8];
    expect(
      isExcludedSupervisionOfficer(officerExcludedFromOutcomes),
    ).toBeTrue();
  });
});
