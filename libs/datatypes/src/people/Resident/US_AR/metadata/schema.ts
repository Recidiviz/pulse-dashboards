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

import { nullishAsUndefined } from "../../../../utils/zod";

export const usArProgramAchievementSchema = z.object({
  programLocation: z.string(),
  programEvaluationScore: nullishAsUndefined(z.string()),
  programAchievementDate: z.string(),
  programType: z.string(),
});

export const usArCurrentSentencesSchema = z.object({
  sentenceId: z.string(),
  startDate: nullishAsUndefined(z.string()),
  endDate: nullishAsUndefined(z.string()),
  personId: z.number(),
  initialTimeServedDays: z.number(),
});

export const usArResidentMetadataSchema = z.object({
  stateCode: z.literal("US_AR"),
  currentCustodyClassification: z.string(),
  currentGtEarningClass: z.string(),
  currentLocation: z.string(),
  currentSentences: z.array(usArCurrentSentencesSchema),
  gedCompletionDate: nullishAsUndefined(z.string()),
  maxFlatReleaseDate: z.string(),
  noIncarcerationSanctionsWithin6Months: z.boolean(),
  noIncarcerationSanctionsWithin12Months: z.boolean(),
  paroleEligibilityDate: z.string(),
  programAchievement: z.array(usArProgramAchievementSchema),
  projectedReleaseDate: z.string(),
});
