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

export const usIaEarlyDischargeSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z
      .object({
        usIaSupervisionLevelIs0NotAvailable12Or3: z
          .object({
            supervisionLevelRawText: z.string().nullable(),
          })
          .nullable(),
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: z
          .object({
            latestViolationReportDates: z.array(dateStringSchema).nullable(),
            violationExpirationDate: dateStringSchema.nullable(),
          })
          .nullable(),
        usIaNoOpenSupervisionModifiers: z
          .object({
            openSupervisionModifiers: z.array(z.string()).nullable(),
          })
          .nullable(),
        supervisionCaseTypeIsNotSexOffense: z
          .object({
            rawSexOffenseCaseTypes: z.array(z.string()).nullable(),
          })
          .nullable(),
        usIaSupervisionFeesPaid: z
          .object({
            initialBalance: z.number().nullable(),
            currentBalance: z.number().nullable(),
          })
          .nullable(),
        usIaNotServingIneligibleOffenseForEarlyDischarge: z
          .object({
            ineligibleOffenses: z.array(z.string()).nullable(),
          })
          .nullable(),
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: z
          .object({
            eligibleDate: dateStringSchema.nullable(),
          })
          .nullable(),
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: z
          .object({
            lifeSentence: z.boolean().nullable(),
            ineligibleOffenses: z.array(z.string()).nullable(),
          })
          .nullable(),
        supervisionTypeIsNotInvestigation: z
          .object({
            rawSupervisionTypes: z.array(z.string()).nullable(),
          })
          .nullable(),
        usIaServingSupervisionCaseAtLeast90Days: z
          .object({
            supervisionCaseStartDate: dateStringSchema,
          })
          .nullable(),
        usIaNotExcludedFromEarlyDischargeByParoleCondition: z
          .object({
            conditions: z.array(z.string()).nullable(),
          })
          .nullable(),
      })
      .passthrough(),
    ineligibleCriteria: z.object({}).passthrough(),
    formInformation: z.object({}).passthrough(),
    metadata: z
      .object({
        victimFlag: z.boolean().optional(),
        violationsPast6MonthsFlag: z.boolean().optional(),
        victimContactInfo: z
          .array(
            z.object({
              VictimFirstNm: z.string().nullish(),
              VictimMiddleNm: z.string().nullish(),
              VictimLastNm: z.string().nullish(),
              VictimSuffix: z.string().nullish(),
              HomePhone: z.string().nullish(),
              WorkPhone: z.string().nullish(),
              CellPhone: z.string().nullish(),
              OtherPhone: z.string().nullish(),
              Fax: z.string().nullish(),
              EmailAddress: z.string().nullish(),
              Address1: z.string().nullish(),
              Address2: z.string().nullish(),
              City: z.string().nullish(),
              State: z.string().nullish(),
              ZipCode: z.string().nullish(),
              Country: z.string().nullish(),
            }),
          )
          .nullish(),
        dnaRequiredFlag: z.boolean().optional(),
        dnaSubmittedFlag: z.boolean().optional(),
        mostRecentDnaSubmittedDate: dateStringSchema.nullish(),
      })
      .passthrough(),
  })
  .passthrough();

export type UsIaEarlyDischargeReferralRecordRaw = z.input<
  typeof usIaEarlyDischargeSchema
>;

export type UsIaEarlyDischargeReferralRecord = z.infer<
  typeof usIaEarlyDischargeSchema
>;
