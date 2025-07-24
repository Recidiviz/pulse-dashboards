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

import {
  ClientCreateInput,
  StaffCreateInput,
} from "~@reentry/import/test/setup/types";
import { PrismaClient, StateCode } from "~@reentry/prisma/client";

export const fakeStaff = {
  staffId: "staff-1",
  pseudonymizedId: "staff-pid-1",
  givenNames: faker.person.firstName(),
  middleNames: faker.person.firstName(),
  surname: faker.person.lastName(),
  email: faker.internet.email(),
  stateCode: StateCode.US_ID,
} satisfies StaffCreateInput;

export const fakeClient = {
  stateCode: StateCode.US_ID,
  personId: "client-person-id-1",
  externalId: "client-ext-1",
  pseudonymizedId: "client-pid-1",
  givenNames: faker.person.firstName(),
  middleNames: faker.person.firstName(),
  surname: faker.person.lastName(),
  suffix: faker.person.suffix(),
  birthDate: faker.date.birthdate(),
  address: faker.location.streetAddress(),
  staff: {
    create: {
      staffId: fakeStaff.staffId,
    },
  },
} satisfies ClientCreateInput;

export async function seed(prismaClient: PrismaClient) {
  // Seed Data

  await prismaClient.staff.create({ data: fakeStaff });
  await prismaClient.client.create({ data: fakeClient });
}
