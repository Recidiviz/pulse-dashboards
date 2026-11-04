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

import { dateStringSchema } from "~datatypes";

const usNycEmergencyContactFullNameSchema = z.object({
  givenNames: z.string().nullable(),
  middleNames: z.string().nullable(),
  surname: z.string().nullable(),
});

const usNycEmergencyContactAddressSchema = z.object({
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  addressCity: z.string().nullable(),
  addressState: z.string().nullable(),
});

const usNycPreSentenceDocketsSchema = z.object({
  docketNumber: z.string().nullable(),
  nextCourtDate: dateStringSchema.nullable(),
  nextCourtLocation: z.string().nullable(),
  nextCourtBorough: z.string().nullable(),
});

export const usNycLegalStatusEnum = z.enum(["Pre-sentence", "Sentenced"]);

export const usNycStateDataSchema = z.object({
  stateCode: z.literal("US_NYC"),
  lastUpdatedDate: dateStringSchema.nullable(),
  housingFacility: z.string().nullable(),
  // TODO(OBT-56128) Change commissaryBalance from numeric to float
  commissaryBalance: z.coerce.number().nullable(),
  emergencyContactFullName: usNycEmergencyContactFullNameSchema.nullable(),
  emergencyContactAddress: usNycEmergencyContactAddressSchema.nullable(),
  legalStatus: usNycLegalStatusEnum.nullable(),
  preSentenceDockets: z.array(usNycPreSentenceDocketsSchema),
  sentencedDate: dateStringSchema.nullable(),
  projectedDischargeDate: dateStringSchema.nullable(),
});
export type UsNycResidentJiiData = z.output<typeof usNycStateDataSchema>;
export type RawUsNycResidentJiiData = z.input<typeof usNycStateDataSchema>;
