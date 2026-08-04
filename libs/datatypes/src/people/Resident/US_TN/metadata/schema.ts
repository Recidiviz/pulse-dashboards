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

import { dateStringSchema } from "../../../../utils/zod";

export const usTnJiiCreditsSchema = z.object({
  creditDate: dateStringSchema,
  creditType: z
    .enum([
      "60_DAY_ED_CREDIT",
      "60_DAY_TREATMENT",
      "BEHAVIOR",
      "BONUS_BEHAVIOR",
      "DRUG_ALCOHOL",
      "GED",
      "PROGRAM",
      "BONUS_PROGRAM",
      "REMOVAL",
    ])
    .nullable(),
  creditsEarned: z.number().nullable(),
});

export const usTnResidentCommonSchema = z.object({
  stateCode: z.literal("US_TN"),
});
export type UsTnResidentCommon = z.infer<typeof usTnResidentCommonSchema>;
export type RawUsTnResidentCommon = z.input<typeof usTnResidentCommonSchema>;

// TODO(OBT-29535): remove this from the workflows schema and move to @jii/schemas
export const usTnResidentJiiDataSchema = usTnResidentCommonSchema.extend({
  expirationDate: dateStringSchema.nullable(),
  expirationDateOriginal: dateStringSchema.nullable(),
  releaseEligibilityDate: dateStringSchema.nullable(),
  sentenceEffectiveDate: dateStringSchema.nullable(),
  creditActivity: z.array(usTnJiiCreditsSchema),
  fileUpdateDate: dateStringSchema,
});
export type UsTnResidentJiiData = z.infer<typeof usTnResidentJiiDataSchema>;
export type RawUsTnResidentJiiData = z.input<typeof usTnResidentJiiDataSchema>;

export const usTnSentenceSchema = z.object({
  imposedDate: dateStringSchema.nullable(),
  offenseDate: dateStringSchema.nullable(),
  statute: z.string().nullable(),
  description: z.string().nullable(),
  classificationType: z.string().nullable(),
  classificationSubtype: z.string().nullable(),
  countyCode: z.string().nullable(),
  isViolent: z.boolean().nullable(),
  isSexOffense: z.boolean().nullable(),
});
export type UsTnSentence = z.output<typeof usTnSentenceSchema>;

export const usTnVantageRiskAssessmentSchema = z.object({
  assessmentDate: dateStringSchema.nullable(),
  assessmentType: z.string().nullable(),
  assessmentLevel: z.string().nullable(),
  assessmentLevelRawText: z.string().nullable(),
});
export type UsTnVantageRiskAssessment = z.output<
  typeof usTnVantageRiskAssessmentSchema
>;

export const usTnResidentMetadataSchema = usTnResidentJiiDataSchema.extend({
  latestClassificationDate: dateStringSchema.nullable().optional(),
  latestVantageRiskAssessment: usTnVantageRiskAssessmentSchema
    .nullable()
    .optional(),
  convictionDate: dateStringSchema.nullable().optional(),
  tnSentences: z.array(usTnSentenceSchema).nullable().optional(),
  iscSentences: z.array(usTnSentenceSchema).nullable().optional(),
  diversionSentences: z.array(usTnSentenceSchema).nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export type UsTnResidentMetadata = z.output<typeof usTnResidentMetadataSchema>;
export type UsTnCreditActivity = z.output<typeof usTnJiiCreditsSchema>;
export type UsTnCreditType = NonNullable<UsTnCreditActivity["creditType"]>;
