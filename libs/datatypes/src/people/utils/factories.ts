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

import { faker } from "@faker-js/faker";
import { each, makeFactory } from "factory.ts";
import { z } from "zod";

import { fullNameSchema } from "./fullNameSchema";

const fullNameBuilderSchema = fullNameSchema.required({
  givenNames: true,
  surname: true,
});

export type RandomFullName = z.infer<typeof fullNameBuilderSchema>;

export const fullNameFactory = (sexType: "male" | "female") =>
  makeFactory<RandomFullName>({
    givenNames: each(() => faker.person.firstName(sexType)),
    middleNames: each(() =>
      faker.helpers.maybe(() => faker.person.middleName(sexType), {
        probability: 0.25,
      }),
    ),
    surname: each(() => faker.person.lastName(sexType)),
  });

export const randId = () => faker.string.alphanumeric(6);
export const randPseudonymizedId = () => faker.string.nanoid(16);

export const randDistrict = () =>
  faker.helpers.arrayElement(["REGION 1", "REGION 2", "REGION 3"]);

export const randStaffEmail = (
  stateCode = "US_XX",
  options?: Exclude<Parameters<typeof faker.internet.email>[0], string>,
) =>
  faker.internet.email({
    provider:
      // NOTE: This is to parse a state code into a lowercase string with only the
      // first three characters removed, or all of them if it doesn't start with "US_".
      // e.g. "US_XX" -> "doc.xx.testdomain.gov"
      "doc." +
      (stateCode.trim().startsWith("US_")
        ? stateCode.substring(3).toLowerCase()
        : stateCode) +
      ".testdomain.gov",
    ...(options ?? {}),
  });

export const randJiiBirthdate = () =>
  faker.date.birthdate(
    faker.helpers.weightedArrayElement([
      { weight: 1, value: { mode: "age", min: 18, max: 24 } },
      { weight: 2, value: { mode: "age", min: 25, max: 40 } },
      { weight: 1, value: { mode: "age", min: 41, max: 65 } },
    ]),
  );

export const randJiiGender = () =>
  faker.helpers.weightedArrayElement([
    { weight: 30, value: "MALE" },
    { weight: 30, value: "FEMALE" },
    { weight: 30, value: "NON_BINARY" },
    { weight: 30, value: "TRANS" },
    { weight: 30, value: "TRANS_FEMALE" },
    { weight: 30, value: "TRANS_MALE" },
    { weight: 1, value: "INTERNAL_UNKNOWN" },
    { weight: 1, value: "EXTERNAL_UNKNOWN" },
  ]);

export const randJiiRace = () =>
  faker.helpers.weightedArrayElement([
    { weight: 20, value: "AMERICAN_INDIAN_ALASKAN_NATIVE" },
    { weight: 20, value: "ASIAN" },
    { weight: 20, value: "BLACK" },
    { weight: 1, value: "EXTERNAL_UNKNOWN" },
    { weight: 1, value: "INTERNAL_UNKNOWN" },
    { weight: 20, value: "NATIVE_HAWAIIAN_PACIFIC_ISLANDER" },
    { weight: 20, value: "OTHER" },
    { weight: 20, value: "WHITE" },
  ]);
