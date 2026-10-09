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

import {
  dateStringSchema,
  nullishAsUndefined,
  usNeResidentCommonSchema,
} from "~datatypes";

const usNeCriticalDocumentSchema = z.object({
  documentExpirationDate: dateStringSchema.nullable(),
  documentIssueDate: dateStringSchema.nullable(),
  documentStateCode: z.string().nullable(),
  documentStatus: z.string().nullable(),
  documentType: z.string().nullable(),
});

// there are other criterion values in the underlying TES/Opportunity
// but these are the only ones we expect to make it into the todos-specific field
export const usNeGoodTimeRestorationTodosCriterionEnum = z.enum([
  "US_NE_NO_IDC_MRS_IN_PAST_6_MONTHS",
  "US_NE_LESS_THAN_3_UDC_MRS_IN_PAST_6_MONTHS",
  "US_NE_NO_CLASS_1_MRS_IN_LAST_YEAR",
  "US_NE_NOT_IN_LTRH_FOR_90_DAYS",
  "US_NE_NO_ONGOING_CLINICAL_TREATMENT_PROGRAM_REFUSAL",
]);

export const usNeStateDataSchema = usNeResidentCommonSchema.extend({
  // Sentence dates & info
  sentenceStartDate: dateStringSchema.nullable(),
  mandatoryMinimumDate: dateStringSchema.nullable(),
  paroleEligibilityDate: dateStringSchema.nullable(),
  tentativeReleaseDate: dateStringSchema.nullable(),
  sentenceLastModifiedDate: nullishAsUndefined(dateStringSchema),
  sentenceInfoIsCurrent: z.boolean().nullable(),

  // Jail / dead time
  jailTimeDays: z.number().nullable(),
  deadTimeDays: z.number().nullable(),

  // Mandatory minimum sentence components
  mandatoryMinimumSentenceYears: z.number().nullable(),
  mandatoryMinimumSentenceMonths: z.number().nullable(),
  mandatoryMinimumSentenceDays: z.number().nullable(),

  // Minimum sentence components
  minimumSentenceYears: z.number().nullable(),
  minimumSentenceMonths: z.number().nullable(),
  minimumSentenceDays: z.number().nullable(),

  // Maximum sentence components
  maximumSentenceYears: z.number().nullable(),
  maximumSentenceMonths: z.number().nullable(),
  maximumSentenceDays: z.number().nullable(),

  // Good time fields
  goodTimeAllowedDays: z.number().nullable(),
  goodTimeBalanceDays: z.number().nullable().default(0),
  goodTimeLostDaysNonRestorable: z.number().nullable(),
  goodTimeLastModifiedDate: dateStringSchema.nullable(),
  goodTimeLawNumber: z.string().nullable(),
  goodTimeRestorationTodos: z.array(
    z.object({
      criterion: usNeGoodTimeRestorationTodosCriterionEnum,
      reason: z.object({ latestEligibleDate: dateStringSchema.optional() }),
    }),
  ),

  // Detainers and notifiers
  numHoldsAndDetainers: z.number(),
  numNotifiers: z.number(),

  // LB 191 cumulative credits since sentence start
  lb191Credits: z.number().nullable().default(0),

  criticalDocuments: z.array(usNeCriticalDocumentSchema),
});
export type UsNeResidentJiiData = z.output<typeof usNeStateDataSchema>;
export type RawUsNeResidentJiiData = z.input<typeof usNeStateDataSchema>;
