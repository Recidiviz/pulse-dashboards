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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

const rawCriteriaSchema = z
  .object({
    usOrNoSupervisionSanctionsWithin6Months: z
      .object({
        latestSanctionDate: dateStringSchema,
        violationExpirationDate: dateStringSchema,
      })
      .nullable(),
    usOrSentenceEligible: z.object({
      meetsCriteriaServedHalfOfSentence: z.boolean(),
      meetsCriteriaServed6Months: z.boolean(),
    }),
  })
  .partial()
  .passthrough();

export const usOrEarnedDischargeSentenceSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: rawCriteriaSchema,
    ineligibleCriteria: rawCriteriaSchema,
    metadata: z.object({
      sentence: z.object({
        courtCaseNumber: z.string(),
        sentenceStatute: z.string(),
        sentenceEndDate: dateStringSchema,
        sentenceStartDate: dateStringSchema,
      }),
    }),
  })
  .transform((r) => {
    const pastHalfCompletion =
      r.eligibleCriteria.usOrSentenceEligible
        ?.meetsCriteriaServedHalfOfSentence ||
      r.ineligibleCriteria.usOrSentenceEligible
        ?.meetsCriteriaServedHalfOfSentence;
    const past6Months =
      r.eligibleCriteria.usOrSentenceEligible?.meetsCriteriaServed6Months ||
      r.ineligibleCriteria.usOrSentenceEligible?.meetsCriteriaServed6Months;
    return {
      ...r,
      eligibleCriteria: {
        ...r.eligibleCriteria,
        eligibleStatute: {},
        noConvictionDuringSentence: {},
        ...(pastHalfCompletion ? { pastHalfCompletion: {} } : {}),
        ...(past6Months ? { past6Months: {} } : {}),
      },
      ineligibleCriteria: {
        ...r.ineligibleCriteria,
        ...(!pastHalfCompletion ? { pastHalfCompletion: {} } : {}),
        ...(!past6Months ? { past6Months: {} } : {}),
      },
    };
  });

export type UsOrEarnedDischargeSentenceReferralRecordRaw = z.input<
  typeof usOrEarnedDischargeSentenceSchema
>;

export type UsOrEarnedDischargeSentenceReferralRecord = z.infer<
  typeof usOrEarnedDischargeSentenceSchema
>;
