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

import { StateCode } from "~@meetings/prisma/client";

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
  // Need to coerce into a bigint because our metric exports use strings for these
  person_id: z.coerce.bigint(),
  stable_person_external_id: z.string(),
  stable_person_external_id_type: z.string(),
  pseudonymized_id: z.string(),
  display_person_external_id: z.string(),
  person_name: nameSchema,
  officer_id: z.string(),
  supervision_type: z.string(),
});

export const staffImportSchema = z.object({
  state_code: stateCode,
  // Need to coerce into a bigint because our metric exports use strings for these
  staff_id: z.coerce.bigint(),
  stable_staff_external_id: z.string(),
  pseudonymized_id: z.string(),
  full_name: nameSchema,
  email: z.string().optional(),
});
