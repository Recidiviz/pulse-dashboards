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

import { Temporal } from "temporal-polyfill";

import type { CalendarMonthRef } from "./types";

/**
 * A weekday name as the calendar's settings store it (CalendarWeekday in
 * Spec D), for weekStartsOn and allowedWeekdays.
 */
export type CalendarWeekday =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

const FIRST_DAY_BY_WEEKDAY: Record<CalendarWeekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** Maps the calendar's weekStartsOn to FullCalendar's firstDay: "SUNDAY" gives 0. */
export function weekStartsOnToFirstDay(weekStartsOn: CalendarWeekday): number {
  return FIRST_DAY_BY_WEEKDAY[weekStartsOn];
}

const WEEKDAY_BY_DAY_OF_WEEK: CalendarWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/** The weekday of isoDate, "YYYY-MM-DD": "2026-09-14" gives "MONDAY". */
export function weekdayOf(isoDate: string): CalendarWeekday {
  // Temporal numbers days 1 (Monday) to 7 (Sunday).
  return WEEKDAY_BY_DAY_OF_WEEK[Temporal.PlainDate.from(isoDate).dayOfWeek - 1];
}

/**
 * The calendar date, "YYYY-MM-DD", of an instant in timeZone. FullCalendar
 * passes a day cell's date as the instant the day starts in the calendar's
 * named time zone (midnight in Denver is 06:00 UTC in September), so reading
 * the date in any other zone can land on the day before.
 */
export function toIsoDate(date: Date, timeZone: string): string {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime())
    .toZonedDateTimeISO(timeZone)
    .toPlainDate()
    .toString();
}

/** "YYYY-MM-DD" of the first day of month. */
export function monthStartIso({ year, month }: CalendarMonthRef): string {
  return Temporal.PlainDate.from({ year, month, day: 1 }).toString();
}

/** Whether isoDate, "YYYY-MM-DD", falls inside month. */
export function isInMonth(isoDate: string, { year, month }: CalendarMonthRef) {
  const date = Temporal.PlainDate.from(isoDate);
  return date.year === year && date.month === month;
}
