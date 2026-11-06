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

/** Thrown when no Calendar row has the given code. */
export class CalendarNotFoundError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(`No calendar ${code}`);
    this.name = "CalendarNotFoundError";
    this.code = code;
  }
}

async function loadCalendar(
  prisma: Pick<CalendarPrismaClient, "calendar">,
  code: string,
) {
  return prisma.calendar.findUnique({
    where: { code },
    include: {
      kinds: { orderBy: { sortOrder: "asc" } },
      resourceTypes: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/** A Calendar row with its kinds and resource types, both in sortOrder. */
export type CalendarWithConfig = NonNullable<
  Awaited<ReturnType<typeof loadCalendar>>
>;

/**
 * Loads the calendar with the given code from the client's database. Each
 * state has its own Calendar database, so the client picks the state and
 * callers check the user's state before they get one.
 *
 * Throws CalendarNotFoundError when there's no such calendar. The row holds
 * only the calendar's identity; its settings and entry-type behaviour live in
 * its state's code, not in columns.
 */
export async function findCalendarByCode(
  prisma: Pick<CalendarPrismaClient, "calendar">,
  code: string,
): Promise<CalendarWithConfig> {
  const calendar = await loadCalendar(prisma, code);
  if (!calendar) {
    throw new CalendarNotFoundError(code);
  }
  return calendar;
}
