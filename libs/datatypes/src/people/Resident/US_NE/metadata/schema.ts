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

export const usNeCreditActivitySchema = z.object({
  creditDate: dateStringSchema,
  creditType: z.string(),
  creditsEarned: z.number(),
  actionDate: dateStringSchema.nullable(),
  violationCount: z.string().nullable(),
  violationCode: z.string().nullable(),
  violationDescription: z.string().nullable(),
  isRestorable: z.string().nullable(),
  lastModifiedDate: dateStringSchema.nullable(),
  misconductReportNumber: z.string().nullable(),
});

export const usNeResidentMetadataSchema = z.object({
  stateCode: z.literal("US_NE"),

  // Sentence dates & info
  sentenceStartDate: dateStringSchema.nullable(),
  mandatoryMinimumDate: dateStringSchema.nullable(),
  paroleEligibilityDate: dateStringSchema.nullable(),
  tentativeReleaseDate: dateStringSchema.nullable(),
  sentenceLastModifiedDate: dateStringSchema.nullable(),
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
  goodTimeLostDaysRestorable: z.number().nullable(),
  goodTimeLostDaysNonRestorable: z.number().nullable(),
  goodTimeLastModifiedDate: dateStringSchema.nullable(),
  goodTimeLawNumber: z.string().nullable(),

  creditActivity: z.array(usNeCreditActivitySchema),

  // Detainers and notifiers
  numHoldsAndDetainers: z.number(),
  numNotifiers: z.number(),

  // LB 191 cumulative credits since sentence start
  lb191Credits: z.number().nullable().default(0),
});

export type RawUsNeResidentMetadata = z.input<
  typeof usNeResidentMetadataSchema
>;
export type UsNeResidentMetadata = z.output<typeof usNeResidentMetadataSchema>;
export type UsNeCreditActivity = z.output<typeof usNeCreditActivitySchema>;
