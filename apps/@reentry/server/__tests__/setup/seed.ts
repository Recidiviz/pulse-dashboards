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
import type { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import { Prisma, PrismaClient, StateCode } from "~@reentry/prisma/client";

export const fakeStaff = {
  staffId: 1,
  stableStaffExternalId: "staff-ext-1",
  stableStaffExternalIdType: "staff-ext-type-1",
  pseudonymizedId: "staff-pid-1",
  givenNames: faker.person.firstName(),
  middleNames: faker.person.firstName(),
  surname: faker.person.lastName(),
  email: faker.internet.email(),
  stateCode: StateCode.US_ID,
} satisfies Prisma.StaffCreateInput;

export const fakeClient = {
  stateCode: StateCode.US_ID,
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
  intakeEnabled: true,
  staff: {
    create: {
      staffId: fakeStaff.staffId,
    },
  },
} satisfies Prisma.ClientCreateInput;

export const fakeIntake = {
  id: "intake-1",
  startDate: new Date(),
  sections: [],
  client: {
    connect: {
      personId: 1,
    },
  },
} satisfies Prisma.IntakeCreateInput;

const checkpoint = {
  v: 1,
  id: "1ef4f797-8335-6428-8001-8a1503f9b875",
  ts: "2024-04-19T17:19:07.952Z",
  channel_values: {
    messages: [
      { content: "Hello, world!", section: "Section 1", id: "message-1" },
    ],
  },
  channel_versions: {
    messages: 1,
  },
  versions_seen: {},
  pending_sends: [],
};

export async function seed(
  prismaClient: PrismaClient,
  intakeCheckPointer: PostgresSaver,
) {
  // Seed Data
  await prismaClient.staff.create({
    data: fakeStaff,
  });

  await prismaClient.client.create({
    data: fakeClient,
  });

  await prismaClient.intake.create({
    data: fakeIntake,
  });

  await intakeCheckPointer.put(
    {
      configurable: {
        thread_id: fakeIntake.id,
        checkpoint_ns: "",
      },
    },
    checkpoint,
    { source: "update", step: -1, parents: {}, writes: null },
    checkpoint.channel_versions,
  );
}
