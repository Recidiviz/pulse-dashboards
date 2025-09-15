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

import { faker } from "@faker-js/faker";

import { Prisma, PrismaClient, StateCode } from "~@meetings/prisma/client";

export const fakeStaff = {
  staffId: 1,
  stableStaffExternalId: "staff-ext-1",
  stableStaffExternalIdType: "staff-ext-type-1",
  pseudonymizedId: "staff-pid-1",
  givenNames: faker.person.firstName(),
  middleNames: faker.person.firstName(),
  surname: faker.person.lastName(),
  email: faker.internet.email(),
  stateCode: StateCode.US_NE,
} satisfies Prisma.StaffCreateInput;

export const fakeClient = {
  stateCode: StateCode.US_NE,
  personId: 1,
  stablePersonExternalId: "client-ext-1",
  stablePersonExternalIdType: "client-ext-type-1",
  displayPersonExternalId: "client-display-ext-1",
  pseudonymizedId: "client-pid-1",
  givenNames: faker.person.firstName(),
  middleNames: faker.person.firstName(),
  surname: faker.person.lastName(),
  suffix: faker.person.suffix(),
  birthDate: faker.date.birthdate(),
  staff: {
    create: {
      staffId: fakeStaff.staffId,
    },
  },
  supervisionType: "PAROLE",
} satisfies Prisma.ClientCreateInput;

export async function seed(prismaClient: PrismaClient) {
  // Seed Data
  await prismaClient.staff.create({
    data: fakeStaff,
  });

  await prismaClient.client.create({
    data: fakeClient,
  });
}
