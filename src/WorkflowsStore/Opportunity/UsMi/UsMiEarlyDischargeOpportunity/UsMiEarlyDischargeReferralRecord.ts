/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { z } from "zod";

import { eligibleDateSchema, opportunitySchemaBase } from "../../schemaHelpers";

const objectOrNull = z.object({}).nullable();

const sharedCriteria = z.object({
  supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate:
    eligibleDateSchema,
  supervisionNotPastFullTermCompletionDate: objectOrNull,
  usMiNoActivePpo: objectOrNull,
  usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: objectOrNull,
});

const paroleDualCriteria = z.object({
  supervisionOrSupervisionOutOfStateLevelIsNotHigh: objectOrNull,
  servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: objectOrNull,
  usMiParoleDualSupervisionPastEarlyDischargeDate: objectOrNull,
  usMiNoPendingDetainer: objectOrNull,
  usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
    objectOrNull,
  usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai: objectOrNull,
  usMiNoOwiViolationOnParoleDualSupervision: objectOrNull,
});

const probationCriteria = z.object({
  usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision:
    objectOrNull,
});

const interstateFlag = z.enum(["IC-OUT", "IC-IN"]).optional();

const paroleRecord = opportunitySchemaBase.extend({
  metadata: z.object({
    interstateFlag,
    supervisionType: z.literal("Parole"),
  }),
  eligibleCriteria: sharedCriteria.merge(paroleDualCriteria),
});

const probationRecord = opportunitySchemaBase.extend({
  metadata: z.object({
    interstateFlag,
    supervisionType: z.literal("Probation"),
  }),
  eligibleCriteria: sharedCriteria.merge(probationCriteria),
});

export const usMiEarlyDischargeSchema = z.union([
  paroleRecord,
  probationRecord,
]);

export type UsMiEarlyDischargeAllCriteria =
  | keyof z.infer<typeof paroleRecord>["eligibleCriteria"]
  | keyof z.infer<typeof probationRecord>["eligibleCriteria"];

export type UsMiEarlyDischargeReferralRecordRaw = z.input<
  typeof usMiEarlyDischargeSchema
>;
export type UsMiEarlyDischargeReferralRecord = z.infer<
  typeof usMiEarlyDischargeSchema
>;
