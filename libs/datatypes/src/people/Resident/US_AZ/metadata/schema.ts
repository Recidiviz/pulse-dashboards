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

export const usAzResidentMetadataSchema = z.object({
  stateCode: z.literal("US_AZ"),
  sedDate: nullishAsUndefined(dateStringSchema),
  ercdDate: nullishAsUndefined(dateStringSchema),
  csbdDate: nullishAsUndefined(dateStringSchema),
  projectedCsbdDate: nullishAsUndefined(dateStringSchema),
  acisTprDate: nullishAsUndefined(dateStringSchema),
  projectedTprDate: nullishAsUndefined(dateStringSchema),
  acisDtpDate: nullishAsUndefined(dateStringSchema),
  projectedDtpDate: nullishAsUndefined(dateStringSchema),
  csedDate: nullishAsUndefined(dateStringSchema),
  ercdOrAdd: nullishAsUndefined(z.string()),
  csbdOrTrToAdd: nullishAsUndefined(z.string()),
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  tprApprovalStatus: nullishAsUndefined(z.string()),
  dtpApprovalStatus: nullishAsUndefined(z.string()),
  // Standalone ingested date fields (sourced from person_projected_date_sessions).
  // These are the preferred fields for single-date consumers like the JII app.
  // The V2 suffix on ercd/csbd avoids collision with the "combined" ercdDate/csbdDate
  // fields above, which pack two mutually-exclusive dates into one column and are
  // consumed by workflows.
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
