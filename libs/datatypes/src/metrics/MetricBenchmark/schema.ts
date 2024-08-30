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
import { z } from "zod";

import { preprocessSchemaWithCaseloadCategoryOrType } from "../../people/utils/preprocessSchemaWithCaseloadCategoryOrType";
import {
  dateStringSchemaWithoutTimeShift,
  uppercaseSchemaKeys,
} from "../../utils/zod";
import { targetStatusSchema } from "../utils/constants";

const metricBenchmarkSchemaPreprocess = z.object({
  metricId: z.string(),
  caseloadCategory: z.string(),
  benchmarks: z
    .array(
      z.object({
        target: z.number(),
        endDate: dateStringSchemaWithoutTimeShift,
      }),
    )
    .transform((benchmarks) =>
      benchmarks.sort((a, b) => ascending(a.endDate, b.endDate)),
    ),
  latestPeriodValues: uppercaseSchemaKeys(
    // can't just pass the key enum to z.record because it does not enforce key exhaustiveness
    z.object({
      [targetStatusSchema.enum.FAR]: z.array(z.number()),
      [targetStatusSchema.enum.MET]: z.array(z.number()),
      [targetStatusSchema.enum.NEAR]: z.array(z.number()),
    }),
  ).transform((mapping) => {
    return targetStatusSchema.options.flatMap((key) => {
      return mapping[key].map((value) => ({ value, targetStatus: key }));
    });
  }),
});

// TODO(Recidiviz/recidiviz-data#31634): Remove this transformation once the backend does it
export const metricBenchmarkSchema = preprocessSchemaWithCaseloadCategoryOrType(
  metricBenchmarkSchemaPreprocess,
);

export type MetricBenchmark = z.infer<typeof metricBenchmarkSchema>;
export type RawMetricBenchmark = z.input<typeof metricBenchmarkSchema>;
