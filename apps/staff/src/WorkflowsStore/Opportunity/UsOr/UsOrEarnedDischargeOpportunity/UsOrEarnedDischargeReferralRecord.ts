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

export const usOrEarnedDischargeSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z.object({
      usOrSentenceEligible: z.object({
        eligibleSentences: z.array(
          z.object({
            sentenceId: z.number(),
          }),
        ),
      }),
      usOrNoSupervisionSanctionsWithin6Months: z.object({}).nullable(),
    }),
    metadata: z.object({
      programs: z.array(
        z.object({
          entryDate: dateStringSchema.nullable(),
          exitDate: dateStringSchema.nullable(),
          treatmentId: z.string(),
          exitCode: z.string().nullable(),
        }),
      ),
      eligibleSentences: z.array(
        z.object({
          sentenceId: z.number(),
          courtCaseNumber: z.string(),
          sentenceStatute: z.string(),
          sentenceSubType: z.string(),
          sentenceImposedDate: dateStringSchema,
          sentenceStartDate: dateStringSchema,
          sentenceEndDate: dateStringSchema,
          sentenceCounty: z.string(),
          chargeCounty: z.string(),
          judgeFullName: z.string().nullable(),
          conditions: z
            .array(
              z.object({
                county: z.string(),
                conditionCode: z.string(),
                conditionDescription: z.string(),
              }),
            )
            .nullable(),
        }),
      ),
    }),
  })
  .transform(
    ({
      stateCode,
      externalId,
      eligibleCriteria,
      metadata: { eligibleSentences, ...personLevelMetadata },
    }) => {
      const metadataById = Object.fromEntries(
        eligibleSentences.map((s) => [s.sentenceId, s]),
      );
      return {
        stateCode,
        externalId,
        metadata: personLevelMetadata,
        subOpportunities:
          eligibleCriteria.usOrSentenceEligible.eligibleSentences.map((s) => ({
            id: s.sentenceId,
            eligibleCriteria: {
              eligibleStatute: {},
              pastHalfCompletionOrSixMonths: {},
              noAdministrativeSanction: {},
              noConvictionDuringSentence: {},
            },
            ineligibleCriteria: {},
            metadata: metadataById[s.sentenceId],
          })),
      };
    },
  );

export type UsOrEarnedDischargeReferralRecordRaw = z.input<
  typeof usOrEarnedDischargeSchema
>;

export type UsOrEarnedDischargeReferralRecord = z.infer<
  typeof usOrEarnedDischargeSchema
>;

export type UsOrEarnedDischargeSubOpportunity =
  UsOrEarnedDischargeReferralRecord["subOpportunities"][number];
