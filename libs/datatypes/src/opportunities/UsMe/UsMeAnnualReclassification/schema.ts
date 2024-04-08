// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { dateStringSchema } from "../../../utils/dateStringSchema";
import { ParsedRecord } from "../../../utils/types";
import { caseNotesSchema } from "../../utils/caseNotesSchema";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

export const usMeAnnualReclassificationSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z.object({
      usMeIncarcerationPastRelevantClassificationDate: z.object({
        latestClassificationDate: dateStringSchema.nullable(),
        reclassType: z.string(),
        reclassesNeeded: z.number(),
      }),
    }),
    ineligibleCriteria: z.object({}),
    formInformation: z.object({
      arrivalDate: dateStringSchema,
      casePlanGoals: z.string(),
      currentOffenses: z.string(),
      programEnrollment: z.string(),
    }),
  })
  .merge(caseNotesSchema);

export type UsMeAnnualReclassificationRecord = ParsedRecord<
  typeof usMeAnnualReclassificationSchema
>;
