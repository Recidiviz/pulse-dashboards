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

import { ascending } from "d3-array";
import { formatISO, subMonths } from "date-fns";
import { range } from "lodash";
import { z } from "zod";

export const ADVERSE_METRIC_IDS = z.enum([
  "incarceration_starts",
  "absconsions_bench_warrants",
  "incarceration_starts_technical_violation",
]);

export const FAVORABLE_METRIC_IDS = z.enum(["treatment_starts"]);

export const CASELOAD_CATEGORY_IDS = z.enum([
  "GENERAL_OR_OTHER",
  "SEX_OFFENSE",
]);

export const LATEST_END_DATE = new Date(2023, 8, 1);

export const LOOKBACK_END_DATES = range(6)
  .map((offset) => subMonths(LATEST_END_DATE, offset))
  .sort(ascending);

export const LOOKBACK_END_DATE_STRINGS = LOOKBACK_END_DATES.map((endDate) =>
  formatISO(endDate, { representation: "date" }),
);

export const targetStatusSchema = z.enum(["FAR", "NEAR", "MET"]);
export type TargetStatus = z.infer<typeof targetStatusSchema>;