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

export const usMoResidentMetadataSchema = z.object({
  stateCode: z.literal("US_MO"),
  d1SanctionInfoPastYear: z.array(usMoSanctionsSchema),
  solitaryAssignmentInfoPastYear: z.array(
    usMoSolitaryAssignmentInfoPastYearSchema,
  ),
  numSolitaryAssignmentsPastYear: z.number(),
  numD1SanctionsPastYear: z.number(),
});
