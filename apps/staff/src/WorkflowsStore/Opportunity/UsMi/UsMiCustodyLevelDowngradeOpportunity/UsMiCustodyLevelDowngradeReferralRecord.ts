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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

export const usMiCustodyLevelDowngradeSchema = opportunitySchemaBase.extend({
  metadata: z.object({
    confinementLevel: z.string(),
    managementLevel: z.string(),
    managementLevelRawScore: z.coerce.number(),
    mostRecentAssessmentDate: dateStringSchema,
    noAssessmentSince26: z.boolean(),
    tabName: z.string(),
  }),
});

export type UsMiCustodyLevelDowngradeReferralRecord = z.infer<
  typeof usMiCustodyLevelDowngradeSchema
>;
