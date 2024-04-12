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

import { ParsedRecord } from "../../utils/types";

const staffRecordBaseSchema = z.object({
  district: z.string().nullish(),
  id: z.string(),
  stateCode: z.string(),
  // If they have an email address they are a known user
  email: z.string().nullish(),
  // TODO(#2458): Move towards using the fullName type like for ClientRecord to standardize name formatting. May require BE changes.
  givenNames: z.string(),
  surname: z.string(),
  // TODO(#4618): Consider getting rid of this and replacing the relevant logic with a feature variant
  roleSubtype: z
    .enum([
      "SUPERVISION_OFFICER",
      "SUPERVISION_OFFICER_SUPERVISOR",
      "SUPERVISION_DISTRICT_MANAGER",
      "SUPERVISION_REGIONAL_MANAGER",
      "SUPERVISION_STATE_LEADERSHIP",
    ])
    .nullish(),
  hasCaseload: z.boolean().optional(),
});

export const supervisionStaffRecordSchema = staffRecordBaseSchema.extend({
  recordType: z.literal("supervisionStaff").default("supervisionStaff"),
  supervisorExternalId: z.string().nullish(),
});
/**
 * Supervision staff-level data exported from the Recidiviz data platform.
 */
export type SupervisionStaffRecord = ParsedRecord<
  typeof supervisionStaffRecordSchema
>;

export const incarcerationStaffRecordSchema = staffRecordBaseSchema.extend({
  recordType: z.literal("incarcerationStaff").default("incarcerationStaff"),
});
/**
 * Incarceration staff-level data exported from the Recidiviz data platform.
 */
export type IncarcerationStaffRecord = ParsedRecord<
  typeof incarcerationStaffRecordSchema
>;

/**
 * Parsed staff-level data exported from the Recidiviz data platform.
 * May be for supervision or incarceration.
 */
export type StaffRecord =
  | IncarcerationStaffRecord["output"]
  | SupervisionStaffRecord["output"];
