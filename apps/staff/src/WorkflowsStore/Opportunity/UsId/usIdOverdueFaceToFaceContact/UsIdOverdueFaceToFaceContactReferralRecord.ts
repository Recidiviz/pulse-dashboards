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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

const usIdOverdueFaceToFaceContactCriteriaSchema = z.object({
  usIdMeetsOverdueFaceToFaceContactAlert: z
    .object({
      caseType: z.string().nullable(),
      lastContactDate: dateStringSchema.nullable(),
      overdueForContactAlertDate: dateStringSchema.nullable().optional(),
      contactRequiredStartDate: dateStringSchema.nullable(),
      supervisionLevel: z.string().nullable(),
    })
    .optional(),
});

export const usIdOverdueFaceToFaceContactSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: usIdOverdueFaceToFaceContactCriteriaSchema.passthrough(),
    ineligibleCriteria: z.object({}).passthrough(),
    contactRequiredStartDate: dateStringSchema.nullable(),
    lastContactDate: dateStringSchema.nullable(),
  })
  .passthrough();

export type UsIdOverdueFaceToFaceContactReferralRecordRaw = z.input<
  typeof usIdOverdueFaceToFaceContactSchema
>;

export type UsIdOverdueFaceToFaceContactReferralRecord = z.infer<
  typeof usIdOverdueFaceToFaceContactSchema
>;
