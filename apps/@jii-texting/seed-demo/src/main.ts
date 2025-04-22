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
  Prisma,
  PrismaClient,
  StateCode,
  Status,
} from "@prisma/jii-texting/client";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma/utils";

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

export async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

async function main() {
  const prismaClient = getPrismaClientForStateCode(StateCode.US_ID);

  await resetDb(prismaClient);

  const topic = await prismaClient.topic.create({
    data: {
      topicName: "LSU",
      stateCode: StateCode.US_ID,
      status: Status.ACTIVE,
      groups: {
        create: [
          {
            groupName: "FULLY_ELIGIBLE",
            messageCopyTemplate: "Hello world",
            status: Status.ACTIVE,
          },
          {
            groupName: "ELIGIBLE_MISSING_FINES_AND_FEES",
            messageCopyTemplate: "Hello world",
            status: Status.ACTIVE,
          },
          {
            groupName: "MISSING_DA",
            messageCopyTemplate: "Hello world",
            status: Status.ACTIVE,
          },
          {
            groupName: "MISSING_INCOME_VERIFICATION",
            messageCopyTemplate: "Hello world",
            status: Status.ACTIVE,
          },
          {
            groupName: "TWO_MISSING_CRITERIA",
            messageCopyTemplate: "Hello world",
            status: Status.ACTIVE,
          },
        ],
      },
    } satisfies Prisma.TopicCreateInput,
    select: {
      groups: true,
    },
  });

  await prismaClient.workflowExecution.create({
    data: {
      stateCode: StateCode.US_ID,
      workflowExecutionTime: new Date("2025-03-01"),
      id: "workflow-id1",
    } satisfies Prisma.WorkflowExecutionCreateInput,
  });

  const peopleToCreate: Prisma.PersonCreateInput[] = [];

  const recidivizPhoneNumbers = process.env["PHONE_NUMBERS"]?.split(",") ?? [
    "5514979687",
  ];

  for (const phoneNumber of recidivizPhoneNumbers) {
    const validDistricts = [
      "District 1",
      "district 2",
      "district 3",
      "District 4",
      "district 5",
      "district 7",
    ];

    const randomIndex = Math.floor(Math.random() * validDistricts.length);

    peopleToCreate.push({
      stateCode: StateCode.US_ID,
      pseudonymizedId: faker.string.uuid(),
      personId: faker.string.uuid(),
      externalId: faker.string.uuid(),
      givenName: faker.person.firstName(),
      middleName: faker.person.middleName(),
      surname: faker.person.lastName(),
      nameSuffix: faker.person.suffix(),
      phoneNumber: phoneNumber,
      officerId: faker.string.uuid(),
      poName: faker.person.fullName(),
      district: `${validDistricts[randomIndex]}`,
    });
  }

  const people = await prismaClient.person.createManyAndReturn({
    data: peopleToCreate,
  });

  // Connect each person to group
  await Promise.all(
    people.map(async (person) => {
      const groupIds = topic.groups.map((group) => group.id);
      const randomIndex = Math.floor(Math.random() * groupIds.length);

      await prismaClient.person.update({
        where: {
          personId: person.personId,
        },
        data: {
          groups: {
            connect: { id: groupIds[randomIndex] },
          },
        },
      });
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
