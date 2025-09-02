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

export const usNeResidentMetadataSchema = z.object({
  stateCode: z.literal("US_NE"),
  deadTimeDays: z.number().nullable(),
  goodTimeAllowedDays: z.number().nullable(),
  goodTimeBalanceDays: z.number().nullable(),
  goodTimeLastModifiedDate: dateStringSchema.nullable(),
  goodTimeLostDaysNonRestorable: z.number().nullable(),
  goodTimeLostDaysRestorable: z.number().nullable(),
  jailTimeDays: z.number().nullable(),
  mandatoryMinimumDate: dateStringSchema.nullable(),
  mandatoryMinimumSentenceDays: z.number().nullable(),
  mandatoryMinimumSentenceMonths: z.number().nullable(),
  mandatoryMinimumSentenceYears: z.number().nullable(),
  maximumSentenceDays: z.number().nullable(),
  maximumSentenceMonths: z.number().nullable(),
  maximumSentenceYears: z.number().nullable(),
  minimumSentenceDays: z.number().nullable(),
  minimumSentenceMonths: z.number().nullable(),
  minimumSentenceYears: z.number().nullable(),
  paroleEligibilityDate: dateStringSchema.nullable(),
  sentenceLastModifiedDate: dateStringSchema.nullable(),
  tentativeReleaseDate: dateStringSchema.nullable(),
});

export type UsNeResidentMetadata = z.output<typeof usNeResidentMetadataSchema>;
