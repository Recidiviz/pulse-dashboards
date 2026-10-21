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

// Temporal helpers shared inside this library. index.ts doesn't export them:
// callers (Prisma, tRPC, FullCalendar) exchange "YYYY-MM-DD" strings, so a
// Temporal upgrade or swap never changes the public API. PlainDate has no time
// zone, which is why a UTC server and a Denver browser get the same dates.

import { Temporal } from "temporal-polyfill";

import { CalendarRulesError } from "./errors";
import { Weekday, WEEKDAYS, YearMonth } from "./types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/**
 * The years the rules accept. The range is wide enough that no real calendar
 * reaches its end, and still rejects mistyped years such as 202 or 20260 that
 * Temporal would accept as real dates.
 */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 5000;

/** Parses a "YYYY-MM-DD" date, throwing INVALID_DATE for anything else. */
export function toPlainDate(value: string): Temporal.PlainDate {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    throw new CalendarRulesError(
      "INVALID_DATE",
      `Expected a YYYY-MM-DD date, got ${JSON.stringify(value)}`,
    );
  }
  try {
    return Temporal.PlainDate.from(value, { overflow: "reject" });
  } catch {
    throw new CalendarRulesError(
      "INVALID_DATE",
      `${value} is not a real calendar date`,
    );
  }
}

/** Throws INVALID_YEAR_MONTH unless ym is a month 1 to 12 in a year MIN_YEAR to MAX_YEAR. */
export function assertYearMonth(ym: YearMonth): void {
  const { year, month } = ym ?? {};
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    year < MIN_YEAR ||
    year > MAX_YEAR
  ) {
    throw new CalendarRulesError(
      "INVALID_YEAR_MONTH",
      `Expected a month 1 to 12 in a year ${MIN_YEAR} to ${MAX_YEAR}, got ${JSON.stringify(ym)}`,
    );
  }
}

/** Returns the 1st of the month, after validating ym. */
export function firstOfMonth(ym: YearMonth): Temporal.PlainDate {
  assertYearMonth(ym);
  return Temporal.PlainDate.from({ year: ym.year, month: ym.month, day: 1 });
}

export function isWeekday(value: unknown): value is Weekday {
  return (WEEKDAYS as readonly unknown[]).includes(value);
}

export function plainDateWeekday(date: Temporal.PlainDate): Weekday {
  // Temporal numbers Monday 1 through Sunday 7; WEEKDAYS starts at Sunday.
  return WEEKDAYS[date.dayOfWeek % 7];
}

/** Returns the first date on or after date that falls on weekday. */
export function nextOnOrAfter(
  date: Temporal.PlainDate,
  weekday: Weekday,
): Temporal.PlainDate {
  const days =
    (WEEKDAYS.indexOf(weekday) - WEEKDAYS.indexOf(plainDateWeekday(date)) + 7) %
    7;
  return date.add({ days });
}

/** Returns the calendar date in timezone at the instant now. */
export function zonedDate(timezone: string, now: Date): Temporal.PlainDate {
  const epochMilliseconds = now.getTime();
  if (Number.isNaN(epochMilliseconds)) {
    throw new CalendarRulesError("INVALID_DATE", "now is an invalid Date");
  }
  const instant = Temporal.Instant.fromEpochMilliseconds(epochMilliseconds);
  try {
    return instant.toZonedDateTimeISO(timezone).toPlainDate();
  } catch {
    throw new CalendarRulesError(
      "INVALID_TIME_ZONE",
      `${JSON.stringify(timezone)} is not a valid IANA time zone`,
    );
  }
}
