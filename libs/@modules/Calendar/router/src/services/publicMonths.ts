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

import type { CalendarPrismaClient, Prisma } from "~@modules/Calendar/prisma";
import { currentYearMonth, YearMonth } from "~@modules/Calendar/rules";

import { formatMonthLabel, publicMonthNotFoundError } from "../calendar.errors";
import type { ResolvedCalendar } from "../procedures";
import type { PublicDay, PublicMonth } from "../types";
import {
  entryInclude,
  formatYearMonth,
  getHolidaysInMonth,
  kindOf,
  kindsById,
  publicMonthWhere,
} from "./helpers";
import { assertPublicMonth, buildPublicDays } from "./publicDays";

type PublicReadClient = Pick<
  CalendarPrismaClient,
  "calendarMonth" | "calendarEntry"
>;

const yearMonthSelect = {
  id: true,
  year: true,
  month: true,
  revision: true,
} satisfies Prisma.CalendarMonthSelect;

type PublicMonthRow = Prisma.CalendarMonthGetPayload<{
  select: typeof yearMonthSelect;
}>;

/** Splits a "YYYY-MM" the input schema has already validated. */
function parseMonthString(value: string): YearMonth {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function findPublicMonth(
  prisma: PublicReadClient,
  calendarId: string,
  { year, month }: YearMonth,
): Promise<PublicMonthRow | null> {
  return prisma.calendarMonth.findFirst({
    where: { ...publicMonthWhere(calendarId), year, month },
    select: yearMonthSelect,
  });
}

/**
 * The nearest public month before or after ym, skipping months that aren't
 * public. It filters and orders on (calendarId, year, month), the month
 * table's unique index, and takes one row, so it never loads every published
 * month.
 */
function findNeighbour(
  prisma: PublicReadClient,
  calendarId: string,
  { year, month }: YearMonth,
  direction: "previous" | "next",
): Promise<PublicMonthRow | null> {
  const cmp = direction === "previous" ? "lt" : "gt";
  const order = direction === "previous" ? "desc" : "asc";
  return prisma.calendarMonth.findFirst({
    where: {
      ...publicMonthWhere(calendarId),
      OR: [{ year: { [cmp]: year } }, { year, month: { [cmp]: month } }],
    },
    orderBy: [{ year: order }, { month: order }],
    select: yearMonthSelect,
  });
}

/**
 * Reads a month's public days from its entries as they are now: only
 * entries whose kind the calendar's rules mark isPublic, with the month's
 * holidays.
 *
 * row is the month as read a moment earlier. Every entry write and status
 * change adds 1 to the revision, so once the entries are read, the month
 * still being PUBLISHED at row.revision proves they're the published ones.
 * Otherwise an editor clicked Edit month in between, and the month is
 * NOT_FOUND, as it would be a moment later.
 */
async function readPublicDays<Kind extends string>(
  prisma: PublicReadClient,
  calendar: Pick<ResolvedCalendar<Kind>, "id" | "rules" | "kinds">,
  row: PublicMonthRow,
): Promise<PublicDay<Kind>[]> {
  const kinds = kindsById(calendar.kinds);
  const entries = await prisma.calendarEntry.findMany({
    where: { monthId: row.id },
    include: entryInclude,
  });
  const unchanged = await prisma.calendarMonth.count({
    where: {
      ...publicMonthWhere(calendar.id),
      id: row.id,
      revision: row.revision,
    },
  });
  if (unchanged === 0) throw publicMonthNotFoundError();
  return buildPublicDays({
    year: row.year,
    month: row.month,
    entries: entries.map((entry) => ({
      ...entry,
      kind: kindOf(kinds, entry.kindId),
    })),
    holidays: getHolidaysInMonth(calendar.rules.settings, row),
  });
}

/**
 * Picks the month a request without one lands on: the current month in
 * the calendar's timezone if it's public, else the nearest later public month
 * (with notPublishedYet naming the current month), else the nearest earlier
 * one. Null when nothing is published.
 */
async function findLandingMonth(
  prisma: PublicReadClient,
  calendar: Pick<ResolvedCalendar, "id" | "rules">,
  now: Date,
): Promise<{ row: PublicMonthRow; notPublishedYet: string | null } | null> {
  const current = currentYearMonth(calendar.rules.settings.timezone, now);
  const exact = await findPublicMonth(prisma, calendar.id, current);
  if (exact) return { row: exact, notPublishedYet: null };

  const later = await findNeighbour(prisma, calendar.id, current, "next");
  if (later) {
    return {
      row: later,
      notPublishedYet: formatMonthLabel(current.year, current.month),
    };
  }

  const earlier = await findNeighbour(prisma, calendar.id, current, "previous");
  return earlier ? { row: earlier, notPublishedYet: null } : null;
}

/**
 * The public read of one month. With month ("YYYY-MM"), that
 * month, or NOT_FOUND when it isn't PUBLISHED; without one, the landing month
 * from findLandingMonth, or null when the calendar has no PUBLISHED month.
 *
 * Days hold the month's entries as they are now. A PUBLISHED month is locked,
 * so they're the entries the editor published; readPublicDays checks the
 * month didn't go back to DRAFT while it read them. previous and next are
 * the nearest PUBLISHED months, past ones included, or null at the ends.
 *
 * The result passes the strict public schema before it's returned, so it
 * carries no ids, emails or revisions.
 */
export async function getPublicMonth<Kind extends string>(
  prisma: PublicReadClient,
  calendar: Pick<ResolvedCalendar<Kind>, "id" | "rules" | "kinds">,
  input: { month?: string },
  now: Date = new Date(),
): Promise<PublicMonth<Kind> | null> {
  let target: { row: PublicMonthRow; notPublishedYet: string | null } | null;
  if (input.month === undefined) {
    target = await findLandingMonth(prisma, calendar, now);
    if (!target) return null;
  } else {
    const row = await findPublicMonth(
      prisma,
      calendar.id,
      parseMonthString(input.month),
    );
    if (!row) throw publicMonthNotFoundError();
    target = { row, notPublishedYet: null };
  }

  const { row, notPublishedYet } = target;
  const [days, previous, next] = await Promise.all([
    readPublicDays(prisma, calendar, row),
    findNeighbour(prisma, calendar.id, row, "previous"),
    findNeighbour(prisma, calendar.id, row, "next"),
  ]);

  const result: PublicMonth<Kind> = {
    month: formatYearMonth(row),
    title: formatMonthLabel(row.year, row.month),
    days,
    previous: previous ? formatYearMonth(previous) : null,
    next: next ? formatYearMonth(next) : null,
    notPublishedYet,
  };
  assertPublicMonth(result);
  return result;
}
