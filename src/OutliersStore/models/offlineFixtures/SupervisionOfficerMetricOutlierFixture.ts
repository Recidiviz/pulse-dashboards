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

import { RawSupervisionOfficerMetricOutlier } from "../SupervisionOfficerMetricOutlier";
import { ADVERSE_METRIC_IDS, LOOKBACK_END_DATE_STRINGS } from "./constants";

export const rawSupervisionOfficerMetricOutlierFixtures = {
  [ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants]: [
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      rate: 0.1604677745537677,
      previousPeriodValues: (
        [
          { rate: 0.06283, status: "NEAR" },
          { rate: 0.088881, status: "NEAR" },
          { rate: 0.109407, status: "FAR" },
          { rate: 0.110487, status: "FAR" },
          { rate: 0.154553, status: "FAR" },
        ] as const
      ).map((data, index) => ({
        ...data,
        endDate: LOOKBACK_END_DATE_STRINGS[index],
      })),
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      rate: 0.11521464646464646,
      previousPeriodValues: (
        [
          { rate: 0.154553, status: "FAR" },
          { rate: 0.109407, status: "FAR" },
          { rate: 0.12125238767544223, status: "FAR" },
          { rate: 0.1466368227731864, status: "FAR" },
          { rate: 0.110487, status: "FAR" },
        ] as const
      ).map((data, index) => ({
        ...data,
        endDate: LOOKBACK_END_DATE_STRINGS[index],
      })),
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      rate: 0.10630035918842831,
      previousPeriodValues: (
        [
          { rate: 0.098509819, status: "FAR" },
          { rate: 0.094708509819, status: "FAR" },
          { rate: 0.0843280708509819, status: "FAR" },
          { rate: 0.1018842831, status: "FAR" },
          { rate: 0.11247207457052615, status: "FAR" },
        ] as const
      ).map((data, index) => ({
        ...data,
        endDate: LOOKBACK_END_DATE_STRINGS[index],
      })),
    },
  ],
  [ADVERSE_METRIC_IDS.enum.incarceration_starts]: [
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      rate: 0.01986070301447383,
      previousPeriodValues: (
        [{ rate: 0.023395936157938592, status: "MET" }] as const
      ).map((data, index) => ({
        ...data,
        endDate: LOOKBACK_END_DATE_STRINGS[index],
      })),
    },
  ],
} satisfies Record<string, RawSupervisionOfficerMetricOutlier[]>;
