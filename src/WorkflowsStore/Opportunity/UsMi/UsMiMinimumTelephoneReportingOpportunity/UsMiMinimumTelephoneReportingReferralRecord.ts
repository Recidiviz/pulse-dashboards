// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  caseNotesSchema,
  dateStringSchema,
  opportunitySchemaBase,
} from "../../schemaHelpers";

// TODO: tighten this up once we see some real records (i.e. what's actually nullable?)
const criteria = z.object({
  onMinimumSupervisionAtLeastSixMonths: z
    .object({
      eligibleDate: dateStringSchema,
    })
    .nullable(),
  usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting: z.object({
    supervisionLevelRawText: z.string(),
    initialAssessmentLevel: z.string(),
  }),
  usMiNotServingIneligibleOffensesForTelephoneReporting: z
    .object({
      ineligibleOffenses: z.array(z.string()),
      sentenceStatus: z.array(z.string()),
      isLifeSentence: z.array(z.string()),
      sentenceStatusRawText: z.array(z.string()),
    })
    .nullable(),
  supervisionNotPastFullTermCompletionDateOrUpcoming90Days: z
    .object({
      eligibleDate: dateStringSchema.nullable(),
    })
    .nullable(),
  usMiNotRequiredToRegisterUnderSora: z
    .object({
      ineligibleDate: dateStringSchema,
    })
    .nullable(),
  usMiIfServingAnOuilOrOwiHasCompleted12MonthsOnSupervision: z
    .object({
      eligibleDate: dateStringSchema,
    })
    .nullable(),
});

export const usMiMinimumTelephoneReportingSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: criteria,
    ineligibleCriteria: z.strictObject({}),
  })
  .merge(caseNotesSchema);

export type UsMiMinimumTelephoneReportingReferralRecord = z.infer<
  typeof usMiMinimumTelephoneReportingSchema
>;

export type UsMiMinimumTelephoneReportingReferralRecordRaw = z.input<
  typeof usMiMinimumTelephoneReportingSchema
>;
