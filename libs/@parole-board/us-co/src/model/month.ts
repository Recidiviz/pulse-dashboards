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

import { daysInMonth, MAX_YEAR, MIN_YEAR } from "~@modules/Calendar/rules";
import type {
  MonthListPage,
  MonthSummary,
  YearMonthOption,
} from "~@parole-board/common";
import { formatDate } from "~utils";

// "2026-10": the month in the URL, as the :yearMonth route takes it.
const YEAR_MONTH_PARAM = /^(\d{4})-(0[1-9]|1[0-2])$/;

const PAST_SUFFIX = " · past";

/** Returns the month as the URL's "YYYY-MM", such as "2026-10". */
export function toYearMonthParam({ year, month }: YearMonthOption): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Reads a "YYYY-MM" route param, such as "2026-10". Returns null for anything
 * else, including "2026-13", and for a year outside the range the calendar API
 * accepts (MIN_YEAR to MAX_YEAR in ~@modules/Calendar/rules).
 */
export function parseYearMonthParam(
  param: string | undefined,
): YearMonthOption | null {
  const match = param ? YEAR_MONTH_PARAM.exec(param) : null;
  if (!match) return null;
  const year = Number(match[1]);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return { year, month: Number(match[2]) };
}

/** Negative when a is before b, 0 for the same month, positive after. */
export function compareYearMonth(a: YearMonthOption, b: YearMonthOption) {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function isSameYearMonth(a: YearMonthOption, b: YearMonthOption) {
  return compareYearMonth(a, b) === 0;
}

/**
 * Every date in the month as "YYYY-MM-DD", in order: September 2026 gives
 * "2026-09-01" to "2026-09-30". The dates are built from the parts, never
 * from a Date, so the browser's timezone can't shift them.
 */
export function monthDays(ym: YearMonthOption): string[] {
  const prefix = toYearMonthParam(ym);
  return Array.from(
    { length: daysInMonth(ym) },
    (_, index) => `${prefix}-${String(index + 1).padStart(2, "0")}`,
  );
}

/** The month's name: September 2026 gives "September". */
export function formatMonthName({ year, month }: YearMonthOption): string {
  return formatDate(new Date(year, month - 1, 1), "MMMM");
}

/** "September 2026". */
export function formatMonthYear({ year, month }: YearMonthOption): string {
  // Built from parts in local time, so the month can't shift with the
  // browser's timezone.
  return formatDate(new Date(year, month - 1, 1), "MMMM yyyy");
}

/**
 * Formats a calendar date such as "2026-09-14" as "September 14". It reads
 * the parts, because new Date("2026-09-14") is UTC midnight, which is the
 * 13th in Colorado.
 */
export function formatMonthDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return formatDate(new Date(year, month - 1, day), "MMMM d");
}

/** "FCF", "FCF and CCF" or "FCF, CCF and SCF". */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** Whether ym is before current, the current month in the calendar's timezone. */
export function isPastMonth(ym: YearMonthOption, current: YearMonthOption) {
  return compareYearMonth(ym, current) < 0;
}

/**
 * The month picker's label: "November 2026", or "September 2026 · past" for a
 * month before current. Past months stay listed and viewable, read-only.
 */
export function monthOptionLabel(
  ym: YearMonthOption,
  current: YearMonthOption,
): string {
  return formatMonthYear(ym) + (isPastMonth(ym, current) ? PAST_SUFFIX : "");
}

/**
 * The month picker's options: every month on the loaded months.list pages, in
 * ascending order, plus viewed when it isn't stored, so the picker can always
 * show the month on screen. Pass null for viewed to list only stored months,
 * as while searching.
 */
export function monthOptions(
  pages: readonly MonthListPage[],
  viewed: YearMonthOption | null,
): YearMonthOption[] {
  const months = pages.flatMap((page) =>
    page.items.map(({ year, month }) => ({ year, month })),
  );
  if (viewed) months.push({ year: viewed.year, month: viewed.month });
  const byKey = new Map(months.map((ym) => [toYearMonthParam(ym), ym]));
  return [...byKey.values()].sort(compareYearMonth);
}

/**
 * Whether editors may change the month's entries: only a DRAFT month from the
 * current month on. A PUBLISHED month is locked: the server refuses
 * every entry write to it, and an editor clicks Edit month to move it back to
 * DRAFT first. Past months are read-only. current is the current month in the
 * calendar's timezone (see useCurrentYearMonth). Every editing control checks
 * it. The server refuses entry writes to a PUBLISHED month; it doesn't check
 * past months yet, so for those this check is the only guard.
 */
export function canEditMonth(
  month: Pick<MonthSummary, "year" | "month" | "status">,
  current: YearMonthOption,
): boolean {
  return month.status === "DRAFT" && !isPastMonth(month, current);
}

/**
 * Whether the header offers "Edit month": the month is PUBLISHED and
 * not past, since past months are read-only. Edit month moves a published
 * month back to draft, so canEditMonth allows its entries to change again.
 * current is the current month in the calendar's timezone. The server checks
 * the status again on months.unpublish.
 */
export function canEditPublishedMonth(
  month: Pick<MonthSummary, "year" | "month" | "status">,
  current: YearMonthOption,
): boolean {
  return month.status === "PUBLISHED" && !isPastMonth(month, current);
}

/**
 * The nearest stored month before and after viewed, skipping months that
 * don't exist, from the months.list pages centred on viewed. Each is null when
 * there is none, so the arrow at that end is disabled.
 */
export function neighborMonths(
  pages: readonly MonthListPage[],
  viewed: YearMonthOption,
): { previous: YearMonthOption | null; next: YearMonthOption | null } {
  const stored = monthOptions(pages, null);
  const next = stored.find((ym) => compareYearMonth(ym, viewed) > 0) ?? null;
  const previous =
    stored.findLast((ym) => compareYearMonth(ym, viewed) < 0) ?? null;
  return { previous, next };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Days from today, a "YYYY-MM-DD" date in the calendar's timezone (see
 * todayIn in ~@modules/Calendar/rules), to the 1st of ym: 0 on the 1st, 1 on
 * the day before, and negative once the month has started. Both dates are
 * read as UTC midnights, so daylight saving time can't add or lose an hour.
 */
export function daysBeforeMonthStart(
  ym: YearMonthOption,
  today: string,
): number {
  const [year, month, day] = today.split("-").map(Number);
  const first = Date.UTC(ym.year, ym.month - 1, 1);
  return Math.round((first - Date.UTC(year, month - 1, day)) / MS_PER_DAY);
}
