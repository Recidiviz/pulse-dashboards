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

import { addDisplayName } from "../../../../../people/utils/addDisplayName";
import { fullNameSchema } from "../../../../../people/utils/fullNameSchema";

export const supervisionOfficerSchema = z
  .object({
    fullName: fullNameSchema,
    externalId: z.string(),
    pseudonymizedId: z.string(),
    email: z.string().nullable(),
    supervisorExternalIds: z.array(z.string()),
    // TODO #6793 Make includeInOutcomes a required field once endpoint response has this field
    includeInOutcomes: z.boolean().optional(),
    zeroGrantOpportunities: z.array(z.string()).optional(),
    avgDailyPopulation: z
      .number()
      .transform((avgDailyPopulation) => Math.round(avgDailyPopulation))
      .nullable(),
  })
  .transform(addDisplayName);

export type SupervisionOfficer = z.infer<typeof supervisionOfficerSchema>;
export type RawSupervisionOfficer = z.input<typeof supervisionOfficerSchema>;
