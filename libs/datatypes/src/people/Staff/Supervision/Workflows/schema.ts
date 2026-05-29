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

import { ParsedRecord } from "~datatypes";

import { nullishAsUndefined } from "../../../../utils/zod";
import { workflowsStaffRecordBaseSchema } from "../../staffWorkflowsRecordBaseSchema";

const addressSchema = nullishAsUndefined(
  z.object({
    line1: z.string(),
    line2: nullishAsUndefined(z.string()),
    city: z.string(),
    zip: z.string(),
  }),
);

const usTxSupervisionStaffStateSpecificSchema = z.object({
  stateCode: z.literal("US_TX"),
  isInUnderstaffedOffice: z.boolean().default(false),
  dpoAddress: addressSchema,
});

const usIxSupervisionStaffStateSpecificSchema = z.object({
  stateCode: z.literal("US_ID"),
  officeAddress: addressSchema,
});

const supervisionStaffStateSpecificSchema = z.union([
  usTxSupervisionStaffStateSpecificSchema,
  usIxSupervisionStaffStateSpecificSchema,
]);

// TODO: (#6249) Change schema name to `workflowsSupervisionStaffRecordSchema`
export const supervisionStaffRecordSchema =
  workflowsStaffRecordBaseSchema.extend({
    recordType: z.literal("supervisionStaff").default("supervisionStaff"),
    supervisorExternalId: z.string().nullish(),
    supervisorExternalIds: z.array(z.string().nullish()).nullish(),
    stateSpecificData: supervisionStaffStateSpecificSchema.optional(),
  });

/**
 * Supervision staff-level data exported from the Recidiviz data platform.
 */
// TODO: (#6249) Change schema name to `WorkflowsSupervisionStaffRecord`
export type SupervisionStaffRecord = ParsedRecord<
  typeof supervisionStaffRecordSchema
>;
