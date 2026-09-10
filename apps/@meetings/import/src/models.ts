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
import { camelCaseObject } from "~utils";

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
  supervision_type: z.string(),
  // TODO(#11886): Remove nullish() when the data is coming through in staging+prod. The array will
  // always exist, but may be empty.
  officer_emails: z.array(z.string().email()).nullish(),
});

export const residentImportSchema = z.object({
  state_code: stateCode,
  // Need to coerce into a bigint because our metric exports use strings for these
  person_id: z.coerce.bigint(),
  stable_person_external_id: z.string(),
  stable_person_external_id_type: z.string(),
  pseudonymized_id: z.string(),
  display_person_external_id: z.string(),
  person_name: nameSchema,
  facility_id: z.string(),
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

// TODO(OBT-49134): Reuse shared schema definitions
const cniFieldSchema = z.object({
  fieldValue: z.string(),
  quotes: z.array(z.string()),
  lastVerifiedDate: z.string(),
  extractorVersionId: z.string(),
  documentId: z.string(),
});

const cniEmploymentFieldsSchema = z.object({
  primaryStatus: cniFieldSchema,
  searchStatus: cniFieldSchema.optional(),
  employers: z.array(
    z
      .object({
        jobTitle: cniFieldSchema,
        employerName: cniFieldSchema,
        employerLocation: cniFieldSchema,
        payRateAmount: cniFieldSchema,
        employmentType: cniFieldSchema,
      })
      .partial(),
  ),
});

const cniEmploymentSchema = z.object({
  category: z.literal("employment"),
  cni_fields: z
    .record(z.string(), z.unknown())
    .transform(camelCaseObject)
    .pipe(cniEmploymentFieldsSchema),
});

const cniHousingFieldsSchema = z
  .object({
    housedType: cniFieldSchema,
    dependentHousingType: cniFieldSchema,
    temporaryHousingName: cniFieldSchema,
    temporaryHousingType: cniFieldSchema,
    unhousedLocation: cniFieldSchema,
    address: cniFieldSchema,
  })
  .partial()
  .extend({ primaryStatus: cniFieldSchema });

const cniHousingSchema = z.object({
  category: z.literal("housing"),
  // The raw export has snake_case keys; camelCase them before validating.
  cni_fields: z
    .record(z.string(), z.unknown())
    .transform(camelCaseObject)
    .pipe(cniHousingFieldsSchema),
});

const cniFieldsSchema = z.discriminatedUnion("category", [
  cniEmploymentSchema,
  cniHousingSchema,
]);

export const caseNoteInsightsImportSchema = cniFieldsSchema.and(
  z.object({ state_code: stateCode, person_id: z.coerce.bigint() }),
);
