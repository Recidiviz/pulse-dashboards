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

import { fullNameSchema } from "~datatypes";

import { addDisplayName } from "./schemaHelpers";
import { supervisionOfficerMetricOutlierSchema } from "./SupervisionOfficerMetricOutlier";

const supervisionOfficerBaseSchema = z.object({
  fullName: fullNameSchema,
  externalId: z.string(),
  district: z.string().nullable(),
  caseloadType: z.string().nullable(),
  pseudonymizedId: z.string(),
  supervisorExternalIds: z.array(z.string()),
});

export const supervisionOfficerSchema = supervisionOfficerBaseSchema
  .extend({
    outlierMetrics: z.array(supervisionOfficerMetricOutlierSchema),
    topXPctMetrics: z.array(
      z.object({
        metricId: z.string(),
        topXPct: z.number(),
      }),
    ),
  })
  .transform(addDisplayName);

export const excludedSupervisionOfficerSchema =
  supervisionOfficerBaseSchema.transform(addDisplayName);

export type SupervisionOfficer = z.infer<typeof supervisionOfficerSchema>;
export type RawSupervisionOfficer = z.input<typeof supervisionOfficerSchema>;
export type ExcludedSupervisionOfficer = z.infer<
  typeof excludedSupervisionOfficerSchema
>;
export type RawExcludedSupervisionOfficer = z.input<
  typeof excludedSupervisionOfficerSchema
>;
