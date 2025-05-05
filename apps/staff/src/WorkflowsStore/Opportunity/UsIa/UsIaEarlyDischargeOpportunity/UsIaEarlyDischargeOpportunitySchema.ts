// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

// TODO(#8266) Flesh out zod schema based on actual structure
export const usIaEarlyDischargeSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z
      .object({
        noSupervisionViolationWithin6Months: z.boolean().nullable(),
        supervisionCaseTypeIsNotSexOffense: z.boolean().nullable(),
        usIaNoOpenSupervisionModifiers: z.boolean().nullable(),
        usIaNotServingIneligibleOffenseForEarlyDischarge: z
          .boolean()
          .nullable(),
        usIaSupervisionFeesPaid: z
          .object({
            supervisionFeeBalance: z.number().nullable(),
          })
          .nullable(),
        usIaSupervisionLevelIs0NotAvailable12Or3: z
          .object({
            supervisionLevelRawText: z.string().nullable(),
          })
          .nullable(),
        usIa90DaysPassedSinceCaseAssignment: z
          .object({
            caseAssignmentDate: dateStringSchema,
          })
          .nullish(),
        usIaNotWithin30DaysOfReleaseDate: z
          .object({
            releaseDate: dateStringSchema,
          })
          .nullish(),
        usIaNotExcludedFromEarlyDischargePerBoardOrParoleOrder: z
          .object({
            boardOrParoleOrder: z.string().nullable(),
          })
          .nullish(),
      })
      .passthrough(),
    ineligibleCriteria: z.object({}).passthrough(),
    formInformation: z.object({}).passthrough(),
  })
  .passthrough();

export type UsIaEarlyDischargeReferralRecordRaw = z.input<
  typeof usIaEarlyDischargeSchema
>;

export type UsIaEarlyDischargeReferralRecord = z.infer<
  typeof usIaEarlyDischargeSchema
>;
