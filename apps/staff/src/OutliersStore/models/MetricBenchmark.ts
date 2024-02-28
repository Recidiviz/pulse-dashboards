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

import { ascending } from "d3-array";
import { z } from "zod";

import {
  dateStringSchema,
  targetStatusSchema,
  uppercaseSchemaKeys,
} from "./schemaHelpers";

export const metricBenchmarkSchema = z.object({
  metricId: z.string(),
  caseloadType: z.string(),
  benchmarks: z
    .array(
      z.object({
        target: z.number(),
        endDate: dateStringSchema,
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

export type MetricBenchmark = z.infer<typeof metricBenchmarkSchema>;
export type RawMetricBenchmark = z.input<typeof metricBenchmarkSchema>;
