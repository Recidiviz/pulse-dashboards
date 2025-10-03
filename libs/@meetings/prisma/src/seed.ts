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

/* eslint-disable no-await-in-loop */

import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  Client,
  Prisma,
  PrismaClient,
  StateCode,
} from "~@meetings/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env[`DATABASE_URL`],
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean up existing data
  await prisma.meeting.deleteMany({});
  await prisma.clientsToStaff.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.staff.deleteMany({});

  // Seed single staff
  const seededStaff = await prisma.staff.create({
    data: {
      staffId: 1,
      stableStaffExternalId: `staff-ext-1`,
      stableStaffExternalIdType: "staff-ext-type-1",
      pseudonymizedId: `staff-pid-1`,
      givenNames: faker.person.firstName(),
      middleNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      email: faker.internet.email(),
      stateCode: StateCode.US_NE,
    },
  });

  // Seed Clients
  const numberOfClients = 10;
  const createdClients: Client[] = [];
  for (let i = 0; i < numberOfClients; i++) {
    const clientData: Prisma.ClientCreateInput = {
      stateCode: StateCode.US_NE,
      personId: i + 1,
      stablePersonExternalId: `client-ext-${i + 1}`,
      stablePersonExternalIdType: "client-ext-type-1",
      displayPersonExternalId: `client-display-ext-${i + 1}`,
      pseudonymizedId: `client-pid-${i + 1}`,
      givenNames: faker.person.firstName(),
      middleNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      suffix: faker.person.suffix(),
      birthDate: faker.date.birthdate(),
      staff: {
        create: {
          staff: {
            connect: {
              staffId: seededStaff.staffId,
            },
          },
        },
      },
      supervisionType: "PAROLE",
    };
    const client = await prisma.client.create({ data: clientData });
    createdClients.push(client);
  }

  // Seed a meeting for every client
  for (const createdClient of createdClients) {
    await prisma.meeting.create({
      data: {
        id: `meeting-${createdClient.personId}`,
        startTime: faker.date.future(),
        clientId: createdClient.personId,
        staffId: seededStaff.staffId,
        recordingsGCSBucket: "test-audio-bucket",
        recordingsFolderPath: `meeting-${createdClient.personId}`,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
