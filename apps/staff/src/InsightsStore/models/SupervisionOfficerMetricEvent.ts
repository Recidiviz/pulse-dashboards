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

import { dateStringSchema, fullNameSchema } from "./schemaHelpers";

export const supervisionOfficerMetricEventSchema = z.object({
  metricId: z.string(),
  eventDate: dateStringSchema,
  clientId: z.string(),
  clientName: fullNameSchema,
  pseudonymizedClientId: z.string(),
  officerAssignmentDate: dateStringSchema,
  officerAssignmentEndDate: dateStringSchema.nullable(),
  supervisionStartDate: dateStringSchema,
  supervisionEndDate: dateStringSchema.nullable(),
  supervisionType: z.string(),
});

export type SupervisionOfficerMetricEvent = z.infer<
  typeof supervisionOfficerMetricEventSchema
>;
export type RawSupervisionOfficerMetricEvent = z.input<
  typeof supervisionOfficerMetricEventSchema
>;
