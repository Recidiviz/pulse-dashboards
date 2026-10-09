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

// Fields used by both JII and workflows.
export const usNeResidentCommonSchema = z.object({
  stateCode: z.literal("US_NE"),
  creditActivity: z.array(usNeCreditActivitySchema),
  goodTimeLostDaysRestorable: z.number().nullable(),
});
export type UsNeResidentCommon = z.infer<typeof usNeResidentCommonSchema>;
export type RawUsNeResidentCommon = z.input<typeof usNeResidentCommonSchema>;

// there are no workflows-only fields in this schema, but to satisfy the naming convention
// we just alias the shared schema
export const usNeResidentMetadataSchema = usNeResidentCommonSchema;
export type UsNeResidentMetadata = UsNeResidentCommon;
export type RawUsNeResidentMetadata = RawUsNeResidentCommon;

export type UsNeCreditActivity = z.output<typeof usNeCreditActivitySchema>;
