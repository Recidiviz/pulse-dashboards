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

import { dateStringSchemaWithoutTimeShift } from "~datatypes";

import { targetStatusSchema } from "./schemaHelpers";

const rateDatapointSchema = z.object({
  endDate: dateStringSchemaWithoutTimeShift,
  metricRate: z.number(),
  status: targetStatusSchema,
});

export const supervisionOfficerMetricOutlierSchema = z.object({
  metricId: z.string(),
  statusesOverTime: z
    .array(rateDatapointSchema)
    .transform((v) => v.sort((a, b) => ascending(a.endDate, b.endDate))),
});

export type SupervisionOfficerMetricOutlier = z.infer<
  typeof supervisionOfficerMetricOutlierSchema
>;
export type RawSupervisionOfficerMetricOutlier = z.input<
  typeof supervisionOfficerMetricOutlierSchema
>;

export type RateDatapoint = z.infer<typeof rateDatapointSchema>;
