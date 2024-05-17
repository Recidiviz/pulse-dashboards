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

import { dateStringSchema } from "../../utils/dateStringSchema";
import { ParsedRecord } from "../../utils/types";
import { justiceInvolvedPersonRecordSchema } from "../JusticeInvolvedPerson/schema";

/**
 * Data from the Recidiviz data platform about an incarcerated person
 */
export const residentRecordSchema = justiceInvolvedPersonRecordSchema
  .extend({
    facilityId: z.string().nullish(),
    unitId: z.string().nullish(),
    facilityUnitId: z.string().nullish(),
    custodyLevel: z.string().nullish(),
    admissionDate: z.string().nullish(),
    releaseDate: z.string().nullish(),
    portionServedNeeded: z.enum(["1/2", "2/3"]).nullish(),
    sccpEligibilityDate: z.string().nullish(),
    usMePortionNeededEligibleDate: dateStringSchema.nullish(),
    gender: z.string(),
  })
  .transform((input) => ({
    ...input,
    personType: "RESIDENT" as const,
  }));

export type ResidentRecord = ParsedRecord<typeof residentRecordSchema>;
