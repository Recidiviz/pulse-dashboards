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

import { z } from "zod";

import { fullNameSchema } from "~datatypes";

import { addDisplayName } from "./schemaHelpers";
import { supervisionOfficerMetricOutlierSchema } from "./SupervisionOfficerMetricOutlier";

const supervisionOfficerBaseSchema = z.object({
  fullName: fullNameSchema,
  externalId: z.string(),
  district: z.string().nullable(),
  pseudonymizedId: z.string(),
  supervisorExternalIds: z.array(z.string()),
});

const withOutlierDataSchema = z.object({
  caseloadType: z.string().nullable(),
  outlierMetrics: z.array(supervisionOfficerMetricOutlierSchema),
  topXPctMetrics: z.array(
    z.object({
      metricId: z.string(),
      topXPct: z.number(),
    }),
  ),
  avgDailyPopulation: z
    .number()
    .transform((avgDailyPopulation) => Math.round(avgDailyPopulation)),
});
export type WithOutlierData = z.infer<typeof withOutlierDataSchema>;

export const supervisionOfficerSchema = supervisionOfficerBaseSchema
  .transform(addDisplayName)
  .and(withOutlierDataSchema)
  .transform((officer) => {
    // TODO(Recidiviz/recidiviz-data#31634): Remove this transformation once the backend does it
    const { caseloadType, ...officerWithoutCaseloadType } = officer;
    return {
      ...officerWithoutCaseloadType,
      caseloadCategory: caseloadType,
    };
  });

export const excludedSupervisionOfficerSchema = supervisionOfficerBaseSchema
  .transform(addDisplayName)
  .and(withOutlierDataSchema.partial());
// TODO: Remove once excludedSupervisionOfficerSchema and supervisionOfficerSchema are merged

export type SupervisionOfficer = z.infer<typeof supervisionOfficerSchema>;
export type RawSupervisionOfficer = z.input<typeof supervisionOfficerSchema>;
export type ExcludedSupervisionOfficer = z.infer<
  typeof excludedSupervisionOfficerSchema
>;
export type RawExcludedSupervisionOfficer = z.input<
  typeof excludedSupervisionOfficerSchema
>;
