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

import { dateStringSchema } from "../../utils/zod/date/dateStringSchema";
import { justiceInvolvedPersonRecordSchema } from "../JusticeInvolvedPerson/schema";

export const residentRecordSchema = justiceInvolvedPersonRecordSchema
  .extend({
    facilityId: z.string().nullish(),
    unitId: z.string().nullish(),
    facilityUnitId: z.string().nullish(),
    custodyLevel: z.string().nullish(),
    admissionDate: dateStringSchema.nullish(),
    releaseDate: dateStringSchema.nullish(),
    portionServedNeeded: z.enum(["1/2", "2/3"]).nullish(),
    sccpEligibilityDate: dateStringSchema.nullish(),
    usTnFacilityAdmissionDate: dateStringSchema.nullish(),
    usMePortionNeededEligibleDate: dateStringSchema.nullish(),
    gender: z.string(),
  })
  .transform((input) => ({
    ...input,
    personType: "RESIDENT" as const,
  }));

/**
 * Data from the Recidiviz data platform about an incarcerated person
 */
export type ResidentRecord = z.output<typeof residentRecordSchema>;

/**
 * A Resident record in its raw form, as stored in Firestore
 */
export type RawResidentRecord = z.input<typeof residentRecordSchema>;

/**
 * A Resident record in its raw form, with a discriminating `personType` string literal added.
 * Should only be used in parts of the codebase where, for legacy reasons, resident records
 * are not parsed with Zod.
 */
export type UnparsedResidentRecord = RawResidentRecord & {
  personType: "RESIDENT";
};
