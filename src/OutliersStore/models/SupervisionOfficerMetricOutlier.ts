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

import { z } from "zod";

import { dateStringSchema, targetStatusSchema } from "./schemaHelpers";

export const supervisionOfficerMetricOutlierSchema = z
  .object({
    metricId: z.string(),
    rate: z.number(),
    caseloadType: z.string(),
    previousPeriodValues: z.array(
      z.object({
        endDate: dateStringSchema,
        rate: z.number(),
        status: targetStatusSchema,
      })
    ),
  })
  .transform((officerMetric) => {
    return {
      ...officerMetric,
      // this is implied upstream because the backend will only give us
      // this data for officers in the "FAR" category, but this makes it more explicit
      status: targetStatusSchema.enum.FAR,
    };
  });

export type SupervisionOfficerMetricOutlier = z.infer<
  typeof supervisionOfficerMetricOutlierSchema
>;
export type RawSupervisionOfficerMetricOutlier = z.input<
  typeof supervisionOfficerMetricOutlierSchema
>;
