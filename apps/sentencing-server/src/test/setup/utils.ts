import { faker } from "@faker-js/faker";
import { CaseRecommendation, Prisma } from "@prisma/client";

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

export function createFakeRecidivismSeries() {
  return [
    {
      recommendationType: "Probation" satisfies CaseRecommendation,
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
      recommendationType: "Rider" satisfies CaseRecommendation,
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
      recommendationType: "Term" satisfies CaseRecommendation,
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
