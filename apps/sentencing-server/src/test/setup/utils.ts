import { faker } from "@faker-js/faker";
import { Prisma } from "@prisma/client";

import { prismaClient } from "~sentencing-server/prisma";

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

export async function resetDb() {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

export function createFakeRecidivismSeriesForPrisma() {
  return [
    {
      recommendationType: "Probation",
      dataPoints: {
        createMany: {
          data: [
            {
              cohortMonths: faker.number.int({ max: 100 }),
              eventRate: faker.number.float(),
              lowerCI: faker.number.float(),
              upperCI: faker.number.float(),
            },
          ],
        },
      },
    },
    {
      recommendationType: "Rider",
      dataPoints: {
        createMany: {
          data: [
            {
              cohortMonths: faker.number.int({ max: 100 }),
              eventRate: faker.number.float(),
              lowerCI: faker.number.float(),
              upperCI: faker.number.float(),
            },
          ],
        },
      },
    },
    {
      recommendationType: "Term",
      dataPoints: {
        createMany: {
          data: [
            {
              cohortMonths: faker.number.int({ max: 100 }),
              eventRate: faker.number.float(),
              lowerCI: faker.number.float(),
              upperCI: faker.number.float(),
            },
          ],
        },
      },
    },
  ] satisfies Prisma.RecidivismSeriesCreateWithoutInsightInput[];
}
