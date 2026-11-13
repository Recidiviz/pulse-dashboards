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

import { dateStringSchema, nullishAsUndefined } from "~datatypes";

export const usNycBoroughCodeEnum = z.enum(["X", "I", "K", "Q", "R", "N"]);

export const usNycCourtCodeEnum = z.enum([
  "CIFM",
  "CKS1",
  "CKS2",
  "CKS9",
  "CNC1",
  "CNC2",
  "CNC3",
  "CQQ1",
  "CRT1",
  "CXE1",
  "CXE2",
  "FKA3",
  "FNL7",
  "FQP3",
  "FRR1",
  "FXE2",
  "I-RMSC",
  "N-MDC",
  "RIJC",
  "SKA3",
  "SKA9",
  "SKJ3",
  "SKS9",
  "SNC1",
  "SNC2",
  "SNC7",
  "SNC9",
  "SQC3",
  "SQK1",
  "SQQ1",
  "SQS2",
  "SRR1",
  "SXG1",
  "TRANS",
  "VTCB",
]);

export const usNycFacilityCodeEnum = z.enum([
  "AMKC",
  "BEDF",
  "BHPW",
  "BKDC",
  "EHPW",
  "EMTC",
  "GMDC",
  "GRVC",
  "IMS",
  "MDC",
  "NIC",
  "OBCC",
  "OTXB",
  "RESH",
  "RMSC",
  "RNDC",
  "UNFA",
  "VCBC",
  "WF",
]);

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
  nextCourtTime: z.string().nullable(),
  // TODO(OBT-56217) Replace with court address
  nextCourtLocation: usNycCourtCodeEnum.nullable().catch(null),
  // An unrecognized borough code parses as null rather than failing the whole record.
  nextCourtBorough: usNycBoroughCodeEnum.nullable().catch(null),
});

export const usNycLegalStatusEnum = z.enum(["Pre-sentence", "Sentenced"]);

export const usNycStateDataSchema = z.object({
  stateCode: z.literal("US_NYC"),
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  housingFacility: usNycFacilityCodeEnum.nullable().catch(null),
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
