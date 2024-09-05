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

import {
  ADVERSE_METRIC_IDS,
  CASELOAD_CATEGORY_IDS,
  FAVORABLE_METRIC_IDS,
  LOOKBACK_END_DATE_STRINGS,
} from "../utils/constants";
import { RawSupervisionOfficerMetricOutlier } from "./schema";

export const rawSupervisionOfficerMetricOutlierFixtures = {
  [ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants]: {
    [CASELOAD_CATEGORY_IDS.enum.GENERAL_OR_OTHER]: [
      {
        metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
        statusesOverTime: (
          [
            { metricRate: 0.06283, status: "NEAR" },
            { metricRate: 0.088881, status: "NEAR" },
            { metricRate: 0.109407, status: "FAR" },
            { metricRate: 0.110487, status: "FAR" },
            { metricRate: 0.154553, status: "FAR" },
            { metricRate: 0.1604677745537677, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS[index],
        })),
      },
      {
        metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
        statusesOverTime: (
          [
            { metricRate: 0.154553, status: "FAR" },
            { metricRate: 0.109407, status: "FAR" },
            { metricRate: 0.12125238767544223, status: "FAR" },
            { metricRate: 0.1466368227731864, status: "FAR" },
            { metricRate: 0.110487, status: "FAR" },
            { metricRate: 0.11521464646464646, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS[index],
        })),
      },
    ],
    [CASELOAD_CATEGORY_IDS.enum.SEX_OFFENSE]: [
      {
        metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
        statusesOverTime: (
          [
            { metricRate: 0.098509819, status: "FAR" },
            { metricRate: 0.094708509819, status: "FAR" },
            { metricRate: 0.0843280708509819, status: "FAR" },
            { metricRate: 0.1018842831, status: "FAR" },
            { metricRate: 0.11247207457052615, status: "FAR" },
            { metricRate: 0.10630035918842831, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS[index],
        })),
      },
    ],
  },
  [ADVERSE_METRIC_IDS.enum.incarceration_starts]: {
    [CASELOAD_CATEGORY_IDS.enum.SEX_OFFENSE]: [
      {
        metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
        statusesOverTime: (
          [
            { metricRate: 0.023395936157938592, status: "MET" },
            { metricRate: 0.4331242583488727, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS.slice(-2)[index],
        })),
      },
    ],
  },
  [FAVORABLE_METRIC_IDS.enum.treatment_starts]: {
    [CASELOAD_CATEGORY_IDS.enum.GENERAL_OR_OTHER]: [
      {
        metricId: FAVORABLE_METRIC_IDS.enum.treatment_starts,
        statusesOverTime: (
          [
            { metricRate: 0.022968597032909103, status: "FAR" },
            { metricRate: 0, status: "FAR" },
            { metricRate: 0.027919749790220463, status: "FAR" },
            { metricRate: 0.032353114502917085, status: "FAR" },
            { metricRate: 0.03232644409114997, status: "NEAR" },
            { metricRate: 0.028747594548953384, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS[index],
        })),
      },
      {
        metricId: FAVORABLE_METRIC_IDS.enum.treatment_starts,
        statusesOverTime: (
          [
            { metricRate: 0.022968597032909103, status: "FAR" },
            { metricRate: 0, status: "FAR" },
            { metricRate: 0.027919749790220463, status: "FAR" },
            { metricRate: 0.032353114502917085, status: "FAR" },
            { metricRate: 0.03232644409114997, status: "NEAR" },
            { metricRate: 0.028747594548953384, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS[index],
        })),
      },
    ],
    [CASELOAD_CATEGORY_IDS.enum.SEX_OFFENSE]: [
      {
        metricId: FAVORABLE_METRIC_IDS.enum.treatment_starts,
        statusesOverTime: (
          [
            { metricRate: 0.022968597032909103, status: "FAR" },
            { metricRate: 0, status: "FAR" },
            { metricRate: 0.027919749790220463, status: "FAR" },
            { metricRate: 0.032353114502917085, status: "FAR" },
            { metricRate: 0.03232644409114997, status: "NEAR" },
            { metricRate: 0.028747594548953384, status: "FAR" },
          ] as const
        ).map((data, index) => ({
          ...data,
          endDate: LOOKBACK_END_DATE_STRINGS[index],
        })),
      },
    ],
  },
} satisfies Record<
  string,
  Record<string, RawSupervisionOfficerMetricOutlier[]>
>;
