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
import { z } from "zod";

import { TEST_STATE_CODE } from "~@sentencing/import/test/setup/constants";
import { Prisma, PrismaClient, StateCode } from "~@sentencing/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

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

/**
 * Imports rows as the given file, through the same handler and schema parsing
 * the import job uses. The rows are read from and written to the test state's
 * database; `loaderStateCode` only picks which state's loaders run, e.g.
 * US_MO for the SAR loaders.
 */
export async function importFile(
  fileName: string,
  rows: unknown[],
  loaderStateCode?: StateCode,
) {
  // Loaded here rather than at the top of the file: setup/index.ts imports this
  // file, and loading the handler that early runs before its vi.mock of the
  // import plugin is ready.
  const { getImportHandler } = await import("~@sentencing/import/handler");
  dataProviderSingleton.setData(`${TEST_STATE_CODE}/${fileName}`, rows);
  await getImportHandler(loaderStateCode).import(TEST_STATE_CODE, [fileName]);
}

/**
 * Overrides for a test's import row: any of the file's columns, with any value.
 * Values stay loose so tests can send what the source data really sends (e.g.
 * numbers as strings), while a misspelled column fails typecheck.
 */
export type ImportRowOverrides<Schema extends z.ZodTypeAny> = Partial<
  Record<keyof z.input<Schema>, unknown>
>;
