// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { getPrismaClient } from "~@modules/Calendar/prisma";

import { createDemoCalendar } from "../setup/fixtures";
import {
  CALENDAR_TABLES,
  resetCalendarTables,
} from "../setup/resetCalendarTables";

const prisma = getPrismaClient("US_CO");

beforeEach(async () => {
  await resetCalendarTables(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function rowCount(
  client: Pick<typeof prisma, "$queryRawUnsafe">,
  table: string,
): Promise<number> {
  const [{ count }] = await client.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT count(*) AS count FROM "${table}"`,
  );
  return Number(count);
}

test("the table list covers every Calendar table in the database", async () => {
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name::text FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'Calendar%'
  `;

  expect(tables.map((row) => row.table_name).sort()).toEqual(
    [...CALENDAR_TABLES].sort(),
  );
});

test("empties every Calendar table", async () => {
  await createDemoCalendar(prisma);

  await resetCalendarTables(prisma);

  for (const table of CALENDAR_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    expect(await rowCount(prisma, table)).toBe(0);
  }
});

// A table outside the list is created inside a transaction that rolls back, so
// the test leaves no table behind.
test("leaves rows in tables outside the Calendar list in place", async () => {
  const rolledBack = new Error("roll back");

  await expect(
    prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'CREATE TABLE "OtherModuleForm" ("id" text PRIMARY KEY)',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "OtherModuleForm" ("id") VALUES (\'form-1\')',
      );

      await resetCalendarTables(tx);

      expect(await rowCount(tx, "OtherModuleForm")).toBe(1);
      throw rolledBack;
    }),
  ).rejects.toBe(rolledBack);
});
