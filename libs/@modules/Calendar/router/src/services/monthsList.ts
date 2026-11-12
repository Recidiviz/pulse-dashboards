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
import type { YearMonth } from "~@modules/Calendar/rules";

import type { MonthListPage } from "../types";
import { latestPublishedEventInclude, toMonthSummary } from "./helpers";

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** The year and month a search names. A missing field matches any value. */
export interface MonthSearch {
  year?: number;
  month?: number;
}

/**
 * Reads a month name, or its first three letters or more, as 1 to 12. Three
 * letters are enough to tell every month apart, so "Jun" and "Jul" each
 * match one month.
 */
function parseMonthName(token: string): number | undefined {
  if (!/^[a-z]{3,}$/.test(token)) return undefined;
  const index = MONTH_NAMES.findIndex((name) => name.startsWith(token));
  return index === -1 ? undefined : index + 1;
}

function parseYear(token: string): number | undefined {
  return /^\d{4}$/.test(token) ? Number(token) : undefined;
}

/**
 * Reads the month dropdown's search text as a year and a month: "2026",
 * "Oct", "October", "October 2026", "2026 October" or "10/2026", in any case
 * and with any spacing. Blank text matches every month. Returns null for text
 * it can't read, which the caller turns into an empty page; a half-typed
 * query isn't an error.
 */
export function parseMonthSearch(text: string): MonthSearch | null {
  const tokens = text
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0) return {};

  if (tokens.length === 1) {
    const [token] = tokens;
    const year = parseYear(token);
    if (year !== undefined) return { year };
    const month = parseMonthName(token);
    if (month !== undefined) return { month };
    const numeric = /^(\d{1,2})\/(\d{4})$/.exec(token);
    if (numeric) {
      const monthNumber = Number(numeric[1]);
      if (monthNumber < 1 || monthNumber > 12) return null;
      return { year: Number(numeric[2]), month: monthNumber };
    }
    return null;
  }

  if (tokens.length === 2) {
    const [first, second] = tokens;
    const month = parseMonthName(first) ?? parseMonthName(second);
    const year = parseYear(second) ?? parseYear(first);
    if (month !== undefined && year !== undefined) return { year, month };
  }
  return null;
}

type MonthWhere = Prisma.CalendarMonthWhereInput;

function before({ year, month }: YearMonth): MonthWhere {
  return {
    OR: [{ year: { lt: year } }, { year, month: { lt: month } }],
  };
}

function after({ year, month }: YearMonth): MonthWhere {
  return {
    OR: [{ year: { gt: year } }, { year, month: { gt: month } }],
  };
}

function atOrAfter({ year, month }: YearMonth): MonthWhere {
  return {
    OR: [{ year: { gt: year } }, { year, month: { gte: month } }],
  };
}

export interface ListMonthsOptions {
  /**
   * The earliest month listed, normally the current month in the calendar's
   * timezone. Editors never see past months.
   */
  from: YearMonth;
  cursor?: YearMonth;
  limit: number;
  /** tRPC's infinite query values: forward is later months, backward earlier. */
  direction: "forward" | "backward";
  around?: YearMonth;
  search?: string;
}

/**
 * Returns one page of a calendar's months from `from` onwards, keyset-paged
 * on (year, month), so every query walks the calendar's unique (calendarId,
 * year, month) index and a page costs the same however many months the
 * calendar holds. Past months stay in the database for the audit trail; the
 * Public Calendar spec only hides them from the month dropdown.
 *
 * A page centred on `around` takes up to half the limit from before that
 * month and the rest from it onwards, and fills from the other side when one
 * side runs short, so a month near either end still gets a full page. A
 * cursor wins over `around`, since tRPC's infinite query hooks send the
 * first page's input, `around` included, with every later page's cursor.
 */
export async function listMonths(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendarId: string,
  options: ListMonthsOptions,
): Promise<MonthListPage> {
  const { from, cursor, limit, direction, around } = options;
  const search = parseMonthSearch(options.search ?? "");
  if (!search) return { items: [], nextCursor: null, prevCursor: null };

  const scope: MonthWhere = { calendarId, ...search, AND: [atOrAfter(from)] };
  const find = (where: MonthWhere, order: "asc" | "desc", take: number) =>
    prisma.calendarMonth.findMany({
      where: { AND: [scope, where] },
      include: latestPublishedEventInclude,
      orderBy: [{ year: order }, { month: order }],
      take,
    });
  const exists = async (where: MonthWhere) =>
    (await prisma.calendarMonth.findFirst({
      where: { AND: [scope, where] },
      select: { id: true },
    })) !== null;

  let rows: Awaited<ReturnType<typeof find>>;
  let hasOlder: boolean;
  let hasNewer: boolean;

  if (around && !cursor) {
    const [older, newer] = await Promise.all([
      find(before(around), "desc", limit + 1),
      find(atOrAfter(around), "asc", limit + 1),
    ]);
    const olderCount = Math.min(
      older.length,
      Math.max(Math.floor(limit / 2), limit - newer.length),
    );
    const newerCount = Math.min(newer.length, limit - olderCount);
    rows = [
      ...older.slice(0, olderCount).reverse(),
      ...newer.slice(0, newerCount),
    ];
    hasOlder = older.length > olderCount;
    hasNewer = newer.length > newerCount;
  } else if (direction === "backward") {
    const page = await find(cursor ? before(cursor) : {}, "desc", limit + 1);
    rows = page.slice(0, limit).reverse();
    hasOlder = page.length > limit;
    // A first page going backward starts at the newest month, so only a page
    // from a cursor can have later months.
    hasNewer =
      cursor !== undefined &&
      rows.length > 0 &&
      (await exists(after(rows[rows.length - 1])));
  } else {
    const page = await find(cursor ? after(cursor) : {}, "asc", limit + 1);
    rows = page.slice(0, limit);
    hasNewer = page.length > limit;
    hasOlder =
      cursor !== undefined &&
      rows.length > 0 &&
      (await exists(before(rows[0])));
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  return {
    items: rows.map(toMonthSummary),
    prevCursor:
      hasOlder && first ? { year: first.year, month: first.month } : null,
    nextCursor:
      hasNewer && last ? { year: last.year, month: last.month } : null,
  };
}
