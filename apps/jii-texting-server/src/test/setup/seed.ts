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
  Status,
} from "@prisma/jii-texting-server/client";

const fakeTopic = {
  topicName: "LSU",
  stateCode: StateCode.US_ID,
  status: Status.ACTIVE,
} satisfies Prisma.TopicCreateInput;

const fakeGroup = {
  groupName: "TRUSTED_TESTER",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

export const fakePerson = {
  stateCode: StateCode.US_ID,
  externalId: "person-ext-1",
  pseudonymizedId: "person-pseudo-id-1",
  personId: "person-id-1",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: "1234567890",
  officerId: "officer-id-1",
  poName: faker.person.fullName(),
  district: faker.location.county(),
  lastOptOutDate: new Date("2025-01-01"),
} satisfies Prisma.PersonCreateInput;

export async function seed(prismaClient: PrismaClient) {
  const topic = await prismaClient.topic.create({
    data: {
      ...fakeTopic,
      groups: {
        create: fakeGroup,
      },
    },
    include: {
      groups: true,
    },
  });

  const group = topic.groups.find(
    (group) => group.groupName === "TRUSTED_TESTER",
  );

  await prismaClient.person.create({
    data: {
      ...fakePerson,
      groups: {
        connect: {
          id: group?.id,
        },
      },
    },
  });
}
