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

import { cloneDeep } from "lodash";
import { flowResult } from "mobx";

import { RootStore } from "../../../RootStore";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import {
  ADVERSE_METRIC_IDS,
  CASELOAD_TYPE_IDS,
} from "../../models/offlineFixtures/constants";
import { metricBenchmarksFixture } from "../../models/offlineFixtures/MetricBenchmarkFixture";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { SupervisionOfficer } from "../../models/SupervisionOfficer";
import { OutliersStore } from "../../OutliersStore";
import { OutliersSupervisionStore } from "../../stores/OutliersSupervisionStore";
import { getOutlierOfficerData } from "../utils";

let officerData: SupervisionOfficer;
let supervisionStore: OutliersSupervisionStore;

beforeEach(() => {
  [, , officerData] = supervisionOfficerFixture;
  supervisionStore = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    OutliersConfigFixture,
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("combines related data", async () => {
  await flowResult(supervisionStore.populateMetricConfigs());
  expect(
    getOutlierOfficerData(officerData, supervisionStore),
  ).toMatchSnapshot();
});

test("excludes current officer from the benchmark data points", async () => {
  // injecting a duplicate value into the benchmark data so we can verify it doesn't get clobbered;
  // this is really more relevant to the favorable metrics that tend to skew towards zero,
  // but it is equally valid for all metrics
  const benchmarks = cloneDeep(metricBenchmarksFixture);
  const outlierMetric = officerData.outlierMetrics[0];
  const matchingBenchmarkForOfficer = benchmarks.find(
    (b) =>
      b.caseloadType === officerData.caseloadType &&
      b.metricId === outlierMetric.metricId,
  );

  if (!matchingBenchmarkForOfficer)
    throw new Error("unable to mock benchmark data");

  const currentOutlierRate = outlierMetric.statusesOverTime.at(-1)
    ?.metricRate as number;

  matchingBenchmarkForOfficer.latestPeriodValues.push({
    targetStatus: "FAR",
    value: currentOutlierRate,
  });
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    .mockResolvedValue(benchmarks);

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(
    supervisionStore.adverseMetricConfigsById
      ?.get(matchingBenchmarkForOfficer.metricId)
      ?.metricBenchmarksByCaseloadType?.get(
        matchingBenchmarkForOfficer.caseloadType,
      )
      ?.latestPeriodValues.filter((d) => d.value === currentOutlierRate),
  ).toHaveLength(2);

  const outlierData = getOutlierOfficerData(officerData, supervisionStore);

  expect(
    outlierData.outlierMetrics[0].benchmark.latestPeriodValues.filter(
      (d) => d.value === currentOutlierRate,
    ),
  ).toHaveLength(1);
});

test("requires a hydrated store", () => {
  expect(() => getOutlierOfficerData(officerData, supervisionStore)).toThrow();
});

test("throws on missing config", async () => {
  supervisionStore = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    {
      ...OutliersConfigFixture,
      metrics: OutliersConfigFixture.metrics.slice(1),
    },
  );

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(() => getOutlierOfficerData(officerData, supervisionStore)).toThrow(
    `Missing metric configuration for ${ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants}`,
  );
});

test("throws if benchmark data was not fully hydrated", async () => {
  // this will be missing all benchmarks for the test metric
  const benchmarks = metricBenchmarksFixture.slice(0, 1);
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    .mockResolvedValue(benchmarks);

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(() => getOutlierOfficerData(officerData, supervisionStore)).toThrow(
    `Missing metric benchmark data for ${ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants}`,
  );
});

test("throws on missing benchmark for required caseload type", async () => {
  // this will be missing the matching caseload type for the test metric
  const benchmarks = [
    metricBenchmarksFixture[0],
    ...metricBenchmarksFixture.slice(2),
  ];
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    .mockResolvedValue(benchmarks);

  await flowResult(supervisionStore.populateMetricConfigs());

  expect(() => getOutlierOfficerData(officerData, supervisionStore)).toThrow(
    `Missing metric benchmark data for caseload type ${CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER} for ${ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants}`,
  );
});
