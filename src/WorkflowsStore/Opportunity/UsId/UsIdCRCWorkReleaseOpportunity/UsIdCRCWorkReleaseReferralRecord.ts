// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { caseNotesSchema, opportunitySchemaBase } from "../../schemaHelpers";
import {
  custodyLevelIsMinimum,
  notServingForSexualOffense,
  usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years,
  usIdNoDetainersForCrc,
} from "../UsIdSharedCriteria";

export const usIdCRCWorkReleaseSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z.object({
      custodyLevelIsMinimum,
      notServingForSexualOffense,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years,
      usIdNoDetainersForCrc,
    }),
    ineligibleCriteria: z.object({}),
  })
  .merge(caseNotesSchema);

export type UsIdCRCWorkReleaseReferralRecord = z.infer<
  typeof usIdCRCWorkReleaseSchema
>;

export type UsIdCRCWorkReleaseReferralRecordRaw = z.input<
  typeof usIdCRCWorkReleaseSchema
>;
