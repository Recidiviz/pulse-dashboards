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

import { staffRecordBaseSchema } from "./staffRecordBaseSchema";

export const workflowsStaffRecordBaseSchema = staffRecordBaseSchema.extend({
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
      "COUNSELOR",
    ])
    .nullish()
    .catch(null),
  hasCaseload: z.boolean().optional(),
  pseudonymizedId: z.string(),
});
