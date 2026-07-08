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

// Fields used by both JII and workflows.
export const usNdResidentCommonSchema = z.object({
  stateCode: z.literal("US_ND"),
  paroleReviewDate: nullishAsUndefined(dateStringSchema),
  eightyFivePercentDate: nullishAsUndefined(dateStringSchema),
});
export type UsNdResidentCommon = z.infer<typeof usNdResidentCommonSchema>;
export type RawUsNdResidentCommon = z.input<typeof usNdResidentCommonSchema>;

// JII-only fields (extends common).
// TODO(OBT-29535): remove this from the workflows schema and move to @jii/schemas
export const usNdResidentJiiDataSchema = usNdResidentCommonSchema.extend({
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  initialReviewDate: nullishAsUndefined(dateStringSchema),
  goodTimeDate: nullishAsUndefined(dateStringSchema),
  finalSentExpDate: nullishAsUndefined(dateStringSchema),
});
export type UsNdResidentJiiData = z.output<typeof usNdResidentJiiDataSchema>;
export type RawUsNdResidentJiiData = z.input<typeof usNdResidentJiiDataSchema>;

// Workflows metadata (extends JII, which extends common).
// TODO(OBT-29535): remove JII-only fields from this schema and move to @jii/schemas
export const usNdResidentMetadataSchema = usNdResidentJiiDataSchema.extend({
  paroleDate: nullishAsUndefined(dateStringSchema),
});
export type UsNdResidentMetadata = z.output<typeof usNdResidentMetadataSchema>;
export type RawUsNdResidentMetadata = z.input<
  typeof usNdResidentMetadataSchema
>;
