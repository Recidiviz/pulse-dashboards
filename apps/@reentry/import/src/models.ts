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

import z from "zod";
import { zu } from "zod_utilz";

import { StateCode } from "~@reentry/prisma/client";

export const nameSchema = zu.stringToJSON().pipe(
  z.object({
    given_names: z.string(),
    middle_names: z.string(),
    name_suffix: z.string(),
    surname: z.string(),
  }),
);

export function fullNameObjectToString(nameObject: z.infer<typeof nameSchema>) {
  return `${nameObject.given_names} ${nameObject.middle_names} ${nameObject.surname} ${nameObject.name_suffix}`;
}

const stateCode = z.preprocess(
  (v) => (v === "US_IX" ? StateCode.US_ID : v),
  z.nativeEnum(StateCode),
);

export const clientImportSchema = z.object({
  state_code: stateCode,
  person_id: z.string(),
  external_id: z.string(),
  pseudonymized_id: z.string(),
  full_name: nameSchema,
  birthdate: z.coerce.date(),
  current_address: z.string(),
  assigned_staff_ids: z.array(z.string()),
});

export const staffImportSchema = z.object({
  staff_id: z.string(),
  pseudonymized_id: z.string(),
  state_code: stateCode,
  full_name: nameSchema,
  email: z.string(),
  client_person_ids: z.array(z.string()),
});
