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
export const usAzResidentCommonSchema = z.object({
  stateCode: z.literal("US_AZ"),
  sedDate: nullishAsUndefined(dateStringSchema),
  acisTprDate: nullishAsUndefined(dateStringSchema),
  acisDtpDate: nullishAsUndefined(dateStringSchema),
  csedDate: nullishAsUndefined(dateStringSchema),
});
export type UsAzResidentCommon = z.output<typeof usAzResidentCommonSchema>;
export type RawUsAzResidentCommon = z.input<typeof usAzResidentCommonSchema>;

// Workflows-only fields (extends common).
export const usAzResidentMetadataSchema = usAzResidentCommonSchema.extend({
  // "Combined" date fields: each packs two mutually-exclusive dates into one column.
  ercdDate: nullishAsUndefined(dateStringSchema),
  csbdDate: nullishAsUndefined(dateStringSchema),
  projectedTprDate: nullishAsUndefined(dateStringSchema),
  projectedDtpDate: nullishAsUndefined(dateStringSchema),
  projectedCsbdDate: nullishAsUndefined(dateStringSchema),
  ercdOrAdd: nullishAsUndefined(z.string()),
  csbdOrTrToAdd: nullishAsUndefined(z.string()),
});
export type UsAzResidentMetadata = z.output<typeof usAzResidentMetadataSchema>;
export type RawUsAzResidentMetadata = z.input<
  typeof usAzResidentMetadataSchema
>;
