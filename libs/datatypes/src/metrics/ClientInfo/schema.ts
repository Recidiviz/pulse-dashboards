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

import { addDisplayName } from "../../people/utils/addDisplayName";
import { fullNameSchema } from "../../people/utils/fullNameSchema";
import { dateStringSchemaWithoutTimeShift } from "../../utils/zod";

export const clientInfoSchema = z
  .object({
    clientName: fullNameSchema,
    clientId: z.string(),
    pseudonymizedClientId: z.string(),
    raceOrEthnicity: z.string().nullable(),
    gender: z.string().nullable(),
    birthdate: dateStringSchemaWithoutTimeShift.nullable(),
  })
  .transform(({ clientName, ...rest }) => {
    return {
      fullName: clientName,
      ...rest,
    };
  })
  .transform(addDisplayName);

export type ClientInfo = z.infer<typeof clientInfoSchema>;
export type RawClientInfo = z.input<typeof clientInfoSchema>;
