// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { StateCode } from "@prisma/jii-texting/client";
import z from "zod";
import { zu } from "zod_utilz";

export const nameSchema = zu.stringToJSON().pipe(
  z.object({
    given_names: z.string(),
    middle_names: z.string(),
    name_suffix: z.string(),
    surname: z.string(),
  }),
);

export const personImportSchema = z.object({
  stable_person_external_id: z.string(),
  pseudonymized_id: z.string(),
  person_id: z.string(),
  state_code: z.nativeEnum(StateCode),
  person_name: nameSchema,
  phone_number: z.string(),
  officer_id: z.string(),
  po_name: z.string(),
  po_phone_number: z.string().optional(),
  district: z.string(),
  group_ids: z.array(z.string()),
});

export const contactImportSchema = z.object({
  state_code: z.nativeEnum(StateCode),
  person_id: z.string(),
  stable_person_external_id: z.string(),
  contact_external_id: z.string(),
  contacting_officer_id: z.string(),
  contacting_po_name: z.string(),
  contacting_po_phone_number: z.string().nullable(),
  contact_location_type: z.string(),
  contact_method: z.string(),
  reminder_type: z.string().nullable(),
  contact_address: z.string().optional(),
  contact_datetime: z.string(),
  update_datetime: z.string(),
});
