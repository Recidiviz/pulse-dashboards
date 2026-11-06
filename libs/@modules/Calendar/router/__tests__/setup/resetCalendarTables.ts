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

import type { CalendarPrismaClient } from "~@modules/Calendar/prisma";

/**
 * Every Calendar table, in the order they appear in calendar.prisma. A test
 * checks this list against the database, so a new Calendar model fails it
 * until the table is added here.
 */
export const CALENDAR_TABLES = [
  "Calendar",
  "CalendarResourceType",
  "CalendarResource",
  "CalendarEntryKind",
  "CalendarEntryPattern",
  "CalendarMonth",
  "CalendarEntry",
  "CalendarMonthStatusEvent",
] as const;

/**
 * Empties every Calendar table. It truncates only the fixed list above, so
 * other tables in the database, such as Prisma's _prisma_migrations, stay.
 * Throws outside Vitest, and throws when the database's name doesn't end in
 * "-test", so a test URL pointed at a dev or deployed database can't wipe it.
 */
export async function resetCalendarTables(
  prisma: Pick<CalendarPrismaClient, "$executeRawUnsafe" | "$queryRawUnsafe">,
): Promise<void> {
  if (!process.env["VITEST"]) {
    throw new Error("resetCalendarTables only runs under Vitest");
  }
  const [{ name }] = await prisma.$queryRawUnsafe<[{ name: string }]>(
    "SELECT current_database()::text AS name",
  );
  if (!name.endsWith("-test")) {
    throw new Error(
      `resetCalendarTables only runs on a test database, not ${name}`,
    );
  }
  const tables = CALENDAR_TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`);
}
