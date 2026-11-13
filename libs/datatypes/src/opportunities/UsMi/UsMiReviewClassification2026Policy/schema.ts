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

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import { usMiClassificationFormBaseSchema } from "../UsMiInitialClassification2026Policy/utils";
export const programCompletionsList = z.array(
  z.object({
    completionDate: dateStringSchema,
    programName: z.string(),
  }),
);

export const latestIncidents = z.array(
  z.object({
    incarcerationIncidentId: z.coerce.number(),
    incidentClass: z.string(),
    incidentDate: dateStringSchema,
    infractionTypeRawText: z.string(),
  }),
);

export const adSeg = z.object({
  adSegEndDateExclusive: dateStringSchema.nullable(),
  adSegStartDate: dateStringSchema.nullable(),
});

export type adSeg = z.infer<typeof adSeg>;
export type latestIncidents = z.infer<typeof latestIncidents>;

export const goodBehaviorPastYearNotes = z.object({
  adSegPlacementsList: z.array(adSeg).nullish(),
  incidentsList: latestIncidents.nullish(),
});

export const goodBehaviorPastFourMonthsNotes = z.object({
  latestAdSegPlacement: z
    .object({
      adSegEndDateExclusive: dateStringSchema.nullable(),
      adSegStartDate: dateStringSchema.nullable(),
    })
    .nullable(),
  latestIncidents,
});

export type goodBehaviorPastYearNotes = z.infer<
  typeof goodBehaviorPastYearNotes
>;
export type goodBehaviorPastFourMonthsNotes = z.infer<
  typeof goodBehaviorPastFourMonthsNotes
>;

export type programCompletionsList = z.infer<typeof programCompletionsList>;

export const usMiReviewClassificationSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      usMiCustodyLevelComparedToRecommended2026Policy: z
        .object({
          custodyLevel: z.string().nullable(),
          recommendedCustodyLevel: z.string().nullable(),
          upcomingEligibilityDate: dateStringSchema,
        })
        .passthrough()
        .partial()
        .nullish(),
      hasInitialClassificationInStatePrisonCustody: z
        .object({
          initialClassificationDecisionDate: dateStringSchema,
          initialAssessmentDate: dateStringSchema,
          mostRecentPrisonCustodyStartDate: dateStringSchema,
          initialClassificationDate: dateStringSchema,
        })
        .passthrough()
        .partial()
        .nullish(),
      usMiAtLeast12MonthsSinceLatestAssessment: z.boolean().nullable(),
    })
    .partial()
    .passthrough(),
  formInformation: usMiClassificationFormBaseSchema.extend({
    programCompleteCoreScore: z.coerce.number().nullable(),
    programCompleteHighScore: z.coerce.number().nullable(),
    programCompleteCoreNotes: z
      .object({
        coreProgramCompletionCount: z.coerce.number().nullable(),
        coreProgramCompletionsList: programCompletionsList,
      })
      .passthrough()
      .partial()
      .nullish(),
    programCompleteHighNotes: z
      .object({
        highProgramCompletionCount: z.coerce.number().nullable(),
        highProgramCompletionsList: programCompletionsList,
      })
      .passthrough()
      .partial()
      .nullish(),
    goodBehPastYearNotes: goodBehaviorPastYearNotes
      .passthrough()
      .partial()
      .nullable(),
    goodBehPastYearScore: z.coerce.number().nullable(),
    goodBehPastFourMonthScore: z.coerce.number().nullable(),
    goodBehPastFourMonthNotes: goodBehaviorPastFourMonthsNotes.nullable(),
  }),
});

export type UsMiReviewClassificationRecord = ParsedRecord<
  typeof usMiReviewClassificationSchema
>;

export type UsMiFormReviewInformation =
  UsMiReviewClassificationRecord["output"]["formInformation"];

export type UsMiReviewClassification2026DraftData =
  UsMiFormReviewInformation & {
    s1q1Selection: number;
    s1q2Selection: number;

    s2q3Selection: number;
    s2q4Selection: number;
    s2q5Selection: number;
    s2q6Selection: number;
    s2q7Selection: number;
    s2q8Selection: number;
    s2q9Selection: number;
    s2q10Selection: number;
    s2q11Selection: number;
    s2q12Selection: number;
    s2q13Selection: number;

    s3q14Selection: number;
    s3q15Selection: number;
    s3q16Selection: number;
    s3q17Selection: number;

    // for overrides

    override1_1Selection: number;
    override1_2Selection: number;
    override2_1Selection: number;
    override2_2Selection: number;
  };
