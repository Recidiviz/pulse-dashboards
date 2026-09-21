// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { getReadableSupervisionLocation } from "../../../../../utils/zod";

/**
 * Minimal officer identity, for contexts (e.g. the roster change request
 * modal) that only need to display and select an officer by name and should
 * not have access to the fuller SupervisionOfficer record.
 */
export const supervisionOfficerNameSchema = z
  .object({
    fullName: fullNameSchema,
    externalId: z.string(),
    district: z
      .string()
      .nullable()
      .transform((d) => getReadableSupervisionLocation(d)),
  })
  .transform(addDisplayName);

export type SupervisionOfficerName = z.infer<
  typeof supervisionOfficerNameSchema
>;
export type RawSupervisionOfficerName = z.input<
  typeof supervisionOfficerNameSchema
>;
