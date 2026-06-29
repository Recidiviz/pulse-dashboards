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

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema, nullishAsUndefined } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const usIdOverdueFaceToFaceContactCriteriaSchema = z.object({
  usIdMeetsOverdueFaceToFaceContactAlert: z
    .object({
      caseType: z.string().nullish(),
      lastContactDate: dateStringSchema.nullish(),
      overdueForContactAlertDate: dateStringSchema.nullish(),
      supervisionLevel: z.string().nullish(),
    })
    .optional(),
});

export const usIdOverdueFaceToFaceContactSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: usIdOverdueFaceToFaceContactCriteriaSchema.passthrough(),
    ineligibleCriteria: z.object({}).passthrough(),
    lastContactDate: dateStringSchema.nullish(),
    metadata: nullishAsUndefined(
      z.object({
        dueDate: nullishAsUndefined(dateStringSchema),
        contactCadence: nullishAsUndefined(z.string()),
      }),
    ),
  })
  .passthrough();

export type UsIdOverdueFaceToFaceContactRecord = ParsedRecord<
  typeof usIdOverdueFaceToFaceContactSchema
>;
