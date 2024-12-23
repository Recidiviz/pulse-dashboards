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

import { rawSupervisionOfficerMetricOutlierFixtures } from "../../../../../metrics/SupervisionOfficerMetricOutlier/fixture";
import {
  CASELOAD_CATEGORY_IDS,
  FAVORABLE_METRIC_IDS,
} from "../../../../../metrics/utils/constants";
import { usIdSupervisionStaffFixtures } from "../../Workflows/fixture";
import {
  RawSupervisionOfficerOutcomes,
  supervisionOfficerOutcomesSchema,
} from "./schema";

export const rawSupervisionOfficerOutcomesFixture: RawSupervisionOfficerOutcomes[] =
  [
    {
      externalId: usIdSupervisionStaffFixtures[0].id,
      pseudonymizedId: "hashed-so1",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.SEX_OFFENSE,
      outlierMetrics: [
        rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
          .SEX_OFFENSE[0],
        rawSupervisionOfficerMetricOutlierFixtures.incarceration_starts
          .SEX_OFFENSE[0],
        rawSupervisionOfficerMetricOutlierFixtures.treatment_starts
          .SEX_OFFENSE[0],
      ],
      topXPctMetrics: [],
    },
    {
      externalId: "so2",
      pseudonymizedId: "hashed-so2",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.ALL,
      outlierMetrics: [],
      topXPctMetrics: [
        { metricId: FAVORABLE_METRIC_IDS.enum.treatment_starts, topXPct: 10 },
      ],
    },
    {
      externalId: "so3",
      pseudonymizedId: "hashed-so3",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.ALL,
      outlierMetrics: [
        rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
          .ALL[1],
        rawSupervisionOfficerMetricOutlierFixtures.treatment_starts.ALL[0],
      ],
      topXPctMetrics: [],
    },
    {
      externalId: "so4",
      pseudonymizedId: "hashed-so4",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.ALL,
      outlierMetrics: [
        rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
          .ALL[0],
        rawSupervisionOfficerMetricOutlierFixtures.treatment_starts.ALL[0],
      ],
      topXPctMetrics: [],
    },
    {
      externalId: "so5",
      pseudonymizedId: "hashed-so5",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.ALL,
      outlierMetrics: [],
      topXPctMetrics: [],
    },
    {
      externalId: "so8",
      pseudonymizedId: "hashed-so8",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.ALL,
      outlierMetrics: [
        rawSupervisionOfficerMetricOutlierFixtures.treatment_starts.ALL[0],
      ],
      topXPctMetrics: [],
    },
    {
      externalId: "so9",
      pseudonymizedId: "hashed-so9",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.ALL,
      outlierMetrics: [
        rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
          .ALL[0],
        rawSupervisionOfficerMetricOutlierFixtures.incarceration_starts.ALL[0],
      ],
      topXPctMetrics: [],
    },
    {
      externalId: "so10",
      pseudonymizedId: "hashed-so10",
      caseloadCategory: CASELOAD_CATEGORY_IDS.enum.NOT_SEX_OFFENSE,
      outlierMetrics: [
        rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
          .NOT_SEX_OFFENSE[0],
        rawSupervisionOfficerMetricOutlierFixtures.incarceration_starts
          .NOT_SEX_OFFENSE[0],
      ],
      topXPctMetrics: [],
    },
  ];

export const supervisionOfficerOutcomesFixture =
  rawSupervisionOfficerOutcomesFixture.map((officerOutcomes) =>
    supervisionOfficerOutcomesSchema.parse(officerOutcomes),
  );
