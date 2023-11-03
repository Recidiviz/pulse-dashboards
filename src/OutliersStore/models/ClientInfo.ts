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

import { dateStringSchema, fullNameSchema } from "./schemaHelpers";

export const clientInfoSchema = z.object({
  clientName: fullNameSchema,
  raceOrEthnicity: z.string(),
  gender: z.string(),
  birthdate: dateStringSchema,
  supervisionStart: dateStringSchema,
  supervisionType: z.string(),
  officerAssignmentStart: dateStringSchema,
});

export type ClientInfo = z.infer<typeof clientInfoSchema>;
export type RawClientInfo = z.input<typeof clientInfoSchema>;
