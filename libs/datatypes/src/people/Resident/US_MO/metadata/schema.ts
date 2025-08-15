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

import simplur from "simplur";
import { z } from "zod";

import { dateStringSchema, nullishAsUndefined } from "../../../../utils/zod";

export const usMoSanctionsSchema = z.object({
  sanctionCode: z.string().nullable(),
  sanctionExpirationDate: dateStringSchema.nullable(),
  sanctionId: z.number().nullable(),
  sanctionStartDate: dateStringSchema.nullable(),
});
export type UsMoSanctionInfo = z.infer<typeof usMoSanctionsSchema>;

const usMoSolitaryAssignmentInfoPastYearSchema = z.object({
  endDate: nullishAsUndefined(dateStringSchema),
  startDate: nullishAsUndefined(dateStringSchema),
});

const sentenceSchema = z.object({
  offense: z.string(),
  sentenceLengthYears: z.number().nullable(),
  sentenceLengthMonths: z.number().nullable(),
  sentenceLengthDays: z.number().nullable(),
});

export const usMoResidentMetadataSchema = z.object({
  stateCode: z.literal("US_MO"),
  d1SanctionInfoPastYear: z.array(usMoSanctionsSchema),
  numD1SanctionsPastYear: z.number(),
  solitaryAssignmentInfoPastYear: z.array(
    usMoSolitaryAssignmentInfoPastYearSchema,
  ),
  numSolitaryAssignmentsPastYear: z.number(),
  medicalScore: z.number().nullable(),
  publicRiskScore: z.number().nullable(),

  maximumReleaseDate: nullishAsUndefined(dateStringSchema),
  conditionalReleaseDate: nullishAsUndefined(dateStringSchema),
  presumptiveParoleDate: nullishAsUndefined(dateStringSchema),

  // TODO(#8881) Remove the optional after #45957 gets to production
  institutionalRiskScore: z.number().nullable().optional(),
  educationScore: z.number().nullable(),
  gangAffiliation: z
    .enum(["NON-STG MEMBER", "STG MEMBER", "STG ASSOCIATE"])
    .nullable(),
  mentalHealthScore: z.number().nullable(),
  latestCycleSentences: sentenceSchema.array(),
  latestCycleCompletedPrograms: z
    .object({
      completionDate: dateStringSchema,
      program: z.string(),
      status: z.string(),
    })
    .array(),
  priorCycleSentences: z
    .object({
      offense: z.string(),
      offenseDate: dateStringSchema.nullable(),
    })
    .array(),
});

export function usMoFormatSentenceLength({
  sentenceLengthYears,
  sentenceLengthMonths,
  sentenceLengthDays,
}: z.infer<typeof sentenceSchema>): string {
  const parts = [];
  if (sentenceLengthYears)
    parts.push(simplur`${sentenceLengthYears} [year|years]`);
  if (sentenceLengthMonths)
    parts.push(simplur`${sentenceLengthMonths} [month|months]`);
  if (sentenceLengthDays) parts.push(simplur`${sentenceLengthDays} [day|days]`);
  return parts.join(", ") || "Length Unknown";
}
