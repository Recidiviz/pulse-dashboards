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
import { addDays } from "date-fns";

async function createPersonWithContact(
  prismaClient: PrismaClient,
  phoneNumber: string,
  createContact: boolean,
) {
  const validLocationType = ["HOME", "OFFICE", "FIELD", "EMPLOYMENT"];
  const randomLocationTypeIndex = Math.floor(
    Math.random() * validLocationType.length,
  );

  const validMethod = ["IN_PERSON", "VIRTUAL"];
  const randomMethodIndex = Math.floor(Math.random() * validMethod.length);

  await prismaClient.person.create({
    data: {
      stateCode: StateCode.US_TX,
      pseudonymizedId: faker.string.uuid(),
      personId: faker.string.uuid(),
      stableExternalId: faker.string.uuid(),
      givenName: faker.person.firstName(),
      middleName: faker.person.middleName(),
      surname: faker.person.lastName(),
      nameSuffix: faker.person.suffix(),
      phoneNumber: phoneNumber,
      officerId: faker.string.uuid(),
      poName: faker.person.fullName(),
      poPhoneNumber: faker.phone.number(),
      district: "REGION 4",
      ...(createContact
        ? {
            contacts: {
              create: [
                {
                  externalId: faker.string.uuid(),
                  locationType: validLocationType[randomLocationTypeIndex],
                  method: validMethod[randomMethodIndex],
                  reminderType: "WITHIN_ONE_DAY",
                  contactingOfficerId: faker.string.uuid(),
                  contactingPoName: faker.person.fullName(),
                  contactingPoPhoneNumber: faker.phone.number(),
                  address: faker.location.streetAddress(),
                  datetime: addDays(new Date(), 1),
                  updateDatetime: new Date(),
                },
              ],
            },
          }
        : {}),
    },
  });
}

export async function seedUsTx(prismaClient: PrismaClient) {
  await prismaClient.topic.create({
    data: {
      topicName: "LSU",
      stateCode: StateCode.US_TX,
      status: Status.ACTIVE,
    } satisfies Prisma.TopicCreateInput,
  });

  await prismaClient.workflowExecution.create({
    data: {
      stateCode: StateCode.US_TX,
      workflowExecutionTime: new Date("2025-10-01"),
      id: "workflow-id1",
    } satisfies Prisma.WorkflowExecutionCreateInput,
  });

  const recidivizPhoneNumbers = process.env["PHONE_NUMBERS"]?.split(",") ?? [
    "5514979687",
  ];

  await Promise.all(
    recidivizPhoneNumbers.map(async (phoneNumber) => {
      // Generate contacts for some people, but not all
      const createContact =
        recidivizPhoneNumbers.length > 1 ? Math.random() < 0.5 : true;

      await createPersonWithContact(prismaClient, phoneNumber, createContact);
    }),
  );
}
