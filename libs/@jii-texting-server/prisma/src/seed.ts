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
import {
  Prisma,
  PrismaClient,
  StateCode,
} from "@prisma/jii-texting-server/client/index.js";

const prisma = new PrismaClient();

async function main() {
  // Person
  await prisma.person.deleteMany({});

  const numberOfPeople = 5;

  const people: Prisma.PersonCreateInput[] = [];

  const group: Prisma.GroupCreateNestedManyWithoutPeopleInput = {};

  for (let i = 0; i < numberOfPeople; i++) {
    people.push({
      stateCode: StateCode.US_ID,
      externalId: faker.string.uuid(),
      pseudonymizedId: faker.string.uuid(),
      personId: faker.string.uuid(),
      givenName: faker.person.firstName(),
      middleName: faker.person.middleName(),
      surname: faker.person.lastName(),
      nameSuffix: faker.person.suffix(),
      phoneNumber: faker.string.numeric({ length: 11 }),
      officerId: faker.string.uuid(),
      poName: faker.person.fullName(),
      district: faker.location.county(),
      groups: group,
    });
  }

  await prisma.person.createMany({ data: people });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
