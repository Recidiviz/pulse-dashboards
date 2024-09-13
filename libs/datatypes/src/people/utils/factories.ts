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
