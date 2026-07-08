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

// JII-only fields (extends common).
// TODO(OBT-29535): remove this from the workflows schema and move to @jii/schemas
export const usAzResidentJiiDataSchema = usAzResidentCommonSchema.extend({
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  tprApprovalStatus: nullishAsUndefined(z.string()),
  dtpApprovalStatus: nullishAsUndefined(z.string()),
  // Standalone ingested date fields (sourced from person_projected_date_sessions).
  // These are the preferred fields for single-date consumers like the JII app.
  // The V2 suffix on ercd/csbd avoids collision with the "combined" ercdDate/csbdDate
  // fields in the workflows schema, which pack two mutually-exclusive dates into one
  // column.
  ercdDateV2: nullishAsUndefined(dateStringSchema),
  csbdDateV2: nullishAsUndefined(dateStringSchema),
  addDate: nullishAsUndefined(dateStringSchema),
  trToAddDate: nullishAsUndefined(dateStringSchema),
  isDprEligible: nullishAsUndefined(z.boolean()),
  hasAnyDprProgramCompleted: nullishAsUndefined(z.boolean()),
  // Standalone ingested DPR date fields (no V2 suffix needed — no name collision).
  dprCsbdDate: nullishAsUndefined(dateStringSchema),
  dprCsedDate: nullishAsUndefined(dateStringSchema),
  dprErcdDate: nullishAsUndefined(dateStringSchema),
  dprTprDate: nullishAsUndefined(dateStringSchema),
  dprDtpDate: nullishAsUndefined(dateStringSchema),
  dprTrToAddDate: nullishAsUndefined(dateStringSchema),
  dprAddDate: nullishAsUndefined(dateStringSchema),
});
export type UsAzResidentJiiData = z.output<typeof usAzResidentJiiDataSchema>;
export type RawUsAzResidentJiiData = z.input<typeof usAzResidentJiiDataSchema>;

// Workflows-only fields (extends JII, which extends common).
// TODO(OBT-29535): remove JII-only fields from this schema and move to @jii/schemas
export const usAzResidentMetadataSchema = usAzResidentJiiDataSchema.extend({
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
