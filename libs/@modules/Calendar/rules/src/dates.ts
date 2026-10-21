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

import { CalendarRulesError } from "./errors";
import {
  assertYearMonth,
  firstOfMonth,
  plainDateWeekday,
  toPlainDate,
  zonedDate,
} from "./plainDates";
import { IsoDate, Weekday, YearMonth } from "./types";

/**
 * Validates a "YYYY-MM-DD" date and returns it in canonical form.
 *
 * Throws INVALID_DATE for anything else, including dates that don't exist,
 * such as "2026-02-30".
 */
export function parseIsoDate(value: string): IsoDate {
  return toPlainDate(value).toString();
}

/** Returns the day of the week that a "YYYY-MM-DD" date falls on. */
export function weekdayOf(date: IsoDate): Weekday {
  return plainDateWeekday(toPlainDate(date));
}

/** Returns the number of days in a month, e.g. 28 for February 2027. */
export function daysInMonth(ym: YearMonth): number {
  return firstOfMonth(ym).daysInMonth;
}

/** Returns whether a "YYYY-MM-DD" date falls inside the given month. */
export function isDateInMonth(date: IsoDate, ym: YearMonth): boolean {
  assertYearMonth(ym);
  const plainDate = toPlainDate(date);
  return plainDate.year === ym.year && plainDate.month === ym.month;
}

/** Returns the month n months after ym. A negative n counts backwards. */
export function addMonths(ym: YearMonth, n: number): YearMonth {
  if (!Number.isInteger(n)) {
    throw new CalendarRulesError(
      "INVALID_YEAR_MONTH",
      `Month offset must be a whole number, got ${n}`,
    );
  }
  const first = firstOfMonth(ym).add({ months: n });
  const result = { year: first.year, month: first.month };
  assertYearMonth(result);
  return result;
}

/**
 * Returns the calendar date in timezone at the instant now.
 *
 * At 2026-10-01T05:30:00Z it's 2026-09-30 in America/Denver and 2026-10-01 in
 * UTC. Throws INVALID_TIME_ZONE when the zone name isn't a valid IANA zone.
 */
export function todayIn(timezone: string, now: Date = new Date()): IsoDate {
  return zonedDate(timezone, now).toString();
}

/** Returns the current month in timezone at the instant now. */
export function currentYearMonth(
  timezone: string,
  now: Date = new Date(),
): YearMonth {
  const today = zonedDate(timezone, now);
  return { year: today.year, month: today.month };
}
