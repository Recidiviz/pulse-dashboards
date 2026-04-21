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
  sedDate: nullishAsUndefined(z.string()),
  ercdDate: nullishAsUndefined(z.string()),
  csbdDate: nullishAsUndefined(z.string()),
  projectedCsbdDate: nullishAsUndefined(z.string()),
  acisTprDate: nullishAsUndefined(z.string()),
  projectedTprDate: nullishAsUndefined(z.string()),
  acisDtpDate: nullishAsUndefined(z.string()),
  projectedDtpDate: nullishAsUndefined(z.string()),
  csedDate: nullishAsUndefined(z.string()),
  ercdOrAdd: nullishAsUndefined(z.string()),
  csbdOrTrToAdd: nullishAsUndefined(z.string()),
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  // Standalone ingested date fields (sourced from person_projected_date_sessions).
  // These are the preferred fields for single-date consumers like the JII app.
  // The V2 suffix on ercd/csbd avoids collision with the "combined" ercdDate/csbdDate
  // fields above, which pack two mutually-exclusive dates into one column and are
  // consumed by workflows.
  ercdDateV2: nullishAsUndefined(z.string()),
  csbdDateV2: nullishAsUndefined(z.string()),
  addDate: nullishAsUndefined(z.string()),
  trToAddDate: nullishAsUndefined(z.string()),
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
