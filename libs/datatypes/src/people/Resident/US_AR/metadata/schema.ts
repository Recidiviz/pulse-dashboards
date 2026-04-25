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

import { dateStringSchema, nullishAsUndefined } from "../../../../utils/zod";

export const usArProgramAchievementSchema = z.object({
  programLocation: z.string(),
  programEvaluationScore: nullishAsUndefined(z.string()),
  programAchievementDate: dateStringSchema,
  programType: z.string(),
});

export const usArCurrentSentencesSchema = z.object({
  sentenceId: z.string(),
  startDate: nullishAsUndefined(dateStringSchema),
  endDate: nullishAsUndefined(dateStringSchema),
  personId: z.number(),
  initialTimeServedDays: z.number(),
});

export const usArResidentMetadataSchema = z.object({
  stateCode: z.literal("US_AR"),
  currentCustodyClassification: z.string(),
  currentGtEarningClass: z.string(),
  currentLocation: z.string(),
  currentSentences: z.array(usArCurrentSentencesSchema),
  eligibilityDate: nullishAsUndefined(dateStringSchema),
  eligibilityDateName: z.enum([
    "Parole Eligibility Date",
    "Transfer Eligibility Date",
    "Release Eligibility Date",
  ]),
  gedCompletionDate: nullishAsUndefined(dateStringSchema),
  lastUpdatedDate: dateStringSchema,
  maximumReleaseDate: nullishAsUndefined(dateStringSchema),
  noIncarcerationSanctionsWithin6Months: z.boolean(),
  noIncarcerationSanctionsWithin12Months: z.boolean(),
  programAchievement: z.array(usArProgramAchievementSchema),
});
export type UsArResidentMetadata = z.output<typeof usArResidentMetadataSchema>;
