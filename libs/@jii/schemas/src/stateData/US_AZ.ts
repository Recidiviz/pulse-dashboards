// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  dateStringSchema,
  nullishAsUndefined,
  toTitleCase,
  usAzResidentCommonSchema,
} from "~datatypes";

export const usAzStateDataSchema = usAzResidentCommonSchema.extend({
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  tprApprovalStatus: nullishAsUndefined(z.string()),
  dtpApprovalStatus: nullishAsUndefined(z.string()),
  // These have a V2 suffix to avoid collision with the "combined" ercdDate/csbdDate
  // fields in the Workflows schema, which pack two mutually-exclusive dates into one
  // column. This is only for historical reasons at this point since this schema has
  // been split off from Workflows and there is no real conflict anymore.
  ercdDateV2: nullishAsUndefined(dateStringSchema),
  csbdDateV2: nullishAsUndefined(dateStringSchema),
  addDate: nullishAsUndefined(dateStringSchema),
  trToAddDate: nullishAsUndefined(dateStringSchema),
  isDprEligible: nullishAsUndefined(z.boolean()),
  hasAnyDprProgramCompleted: nullishAsUndefined(z.boolean()),
  dprCsbdDate: nullishAsUndefined(dateStringSchema),
  dprCsedDate: nullishAsUndefined(dateStringSchema),
  dprErcdDate: nullishAsUndefined(dateStringSchema),
  dprTprDate: nullishAsUndefined(dateStringSchema),
  dprDtpDate: nullishAsUndefined(dateStringSchema),
  dprTrToAddDate: nullishAsUndefined(dateStringSchema),
  dprAddDate: nullishAsUndefined(dateStringSchema),
  // classification points fields
  cuAssignedCustodyLevel: nullishAsUndefined(z.string().transform(toTitleCase)),
  // expected to be a number 1-5; not worth coercing if all we're doing is displaying it anyway
  cuAssignedCustodyLevelNumeric: nullishAsUndefined(z.string()),
  cuAssessmentScore: nullishAsUndefined(z.number()),
  irAssessmentScore: nullishAsUndefined(z.number()),
  // similar to custody level, should be a numeric string 1-5 but not coerced here
  irAssignedRiskLevelNumeric: nullishAsUndefined(z.string()),
  mostRecentClassificationType: nullishAsUndefined(
    z.enum(["INITIAL", "RECLASSIFICATION"]),
  ),
});
export type UsAzResidentJiiData = z.output<typeof usAzStateDataSchema>;
export type RawUsAzResidentJiiData = z.input<typeof usAzStateDataSchema>;
