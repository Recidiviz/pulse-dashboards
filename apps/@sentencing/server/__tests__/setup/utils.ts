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

import { Prisma, PrismaClient } from "~@sentencing/prisma/client";

const PRISMA_TABLES = Object.values(Prisma.ModelName);

export async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

export function createFakeRecidivismSeries() {
  return [
    {
      recommendationType: "Probation",
      dataPoints: [
        {
          cohortMonths: faker.number.int({ max: 100 }),
          eventRate: faker.number.float(),
          lowerCI: faker.number.float(),
          upperCI: faker.number.float(),
        },
      ],
    },
    {
      recommendationType: "Rider",
      dataPoints: [
        {
          cohortMonths: faker.number.int({ max: 100 }),
          eventRate: faker.number.float(),
          lowerCI: faker.number.float(),
          upperCI: faker.number.float(),
        },
      ],
    },
    {
      recommendationType: "Term",
      dataPoints: [
        {
          cohortMonths: faker.number.int({ max: 100 }),
          eventRate: faker.number.float(),
          lowerCI: faker.number.float(),
          upperCI: faker.number.float(),
        },
      ],
    },
  ];
}
