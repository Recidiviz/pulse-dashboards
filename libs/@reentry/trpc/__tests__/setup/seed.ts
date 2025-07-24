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

import { PrismaClient } from "~@reentry/prisma/client/client";

export const intakeId = "intake-1";

export async function seed(prismaClient: PrismaClient) {
  // Seed Data
  await prismaClient.client.create({
    data: {
      stateCode: "US_ID",
      personId: "client-person-id-1",
      externalId: "client-external-id-1",
      pseudonymizedId: "client-pseudonymized-id-1",
      givenNames: "Jane",
      surname: "Doe",
      birthDate: new Date("1990-01-01"),
    },
  });

  await prismaClient.staff.create({
    data: {
      stateCode: "US_ID",
      email: "staff-1@idaho.idoc.gov",
      staffId: "staff-person-id-1",
      pseudonymizedId: "staff-pseudonymized-id-1",
      givenNames: "Jane",
      surname: "Doe",
      clients: {
        create: {
          clientId: "client-person-id-1",
        },
      },
    },
  });

  await prismaClient.intake.create({
    data: {
      id: intakeId,
      startDate: new Date(),
      sections: [],
      client: {
        connect: {
          personId: "client-person-id-1",
        },
      },
    },
  });
}
