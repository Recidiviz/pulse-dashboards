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

import { SupervisionOfficerOutcomes } from "~datatypes";

import { filterHiddenOutlierMetrics } from "../filterHiddenOutlierMetrics";

const baseMetric = {
  statusesOverTime: [
    {
      status: "FAR" as const,
      endDate: new Date("2026-05-01"),
      metricRate: 0,
    },
  ],
};

const baseOutcomes: SupervisionOfficerOutcomes = {
  externalId: "test-officer",
  pseudonymizedId: "hashed-test-officer",
  caseloadCategory: "ALL",
  outlierMetrics: [],
  topXPctMetrics: [],
};

describe("filterHiddenOutlierMetrics", () => {
  it("removes task_completions_early_discharge from outlierMetrics", () => {
    const result = filterHiddenOutlierMetrics({
      ...baseOutcomes,
      outlierMetrics: [
        { metricId: "absconsions_bench_warrants", ...baseMetric },
        { metricId: "task_completions_early_discharge", ...baseMetric },
      ],
    });

    expect(result.outlierMetrics.map((m) => m.metricId)).toEqual([
      "absconsions_bench_warrants",
    ]);
  });

  it("leaves topXPctMetrics untouched (banner data preserved)", () => {
    const topXPctMetrics = [
      { metricId: "task_completions_early_discharge", topXPct: 10 },
      { metricId: "absconsions_bench_warrants", topXPct: 10 },
    ];

    const result = filterHiddenOutlierMetrics({
      ...baseOutcomes,
      outlierMetrics: [
        { metricId: "task_completions_early_discharge", ...baseMetric },
      ],
      topXPctMetrics,
    });

    expect(result.topXPctMetrics).toEqual(topXPctMetrics);
  });

  it("leaves other adverse outlier metrics untouched", () => {
    const outlierMetrics = [
      { metricId: "absconsions_bench_warrants", ...baseMetric },
      { metricId: "incarceration_starts_and_inferred", ...baseMetric },
    ];

    const result = filterHiddenOutlierMetrics({
      ...baseOutcomes,
      outlierMetrics,
    });

    expect(result.outlierMetrics).toEqual(outlierMetrics);
  });

  it("leaves other favorable outlier metrics untouched (e.g. CA treatment_starts)", () => {
    const result = filterHiddenOutlierMetrics({
      ...baseOutcomes,
      outlierMetrics: [{ metricId: "treatment_starts", ...baseMetric }],
    });

    expect(result.outlierMetrics.map((m) => m.metricId)).toEqual([
      "treatment_starts",
    ]);
  });
});
