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

/** A calendar date with no time or zone, formatted "YYYY-MM-DD". */
export type IsoDate = string;

/** Days of the week, Sunday first. The index of each value is its weekday number. */
export const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

/** Same values as the Prisma CalendarWeekday enum. */
export type Weekday = (typeof WEEKDAYS)[number];

/**
 * The weeks a weekOfMonth rule can target, counted as the calendar's
 * weekNumbering says:
 *
 * - FIRST_FULL_WEEK: week 1 is the first full week of the month, starting on
 *   weekStartsOn. Days before it belong to no week.
 * - NTH_WEEKDAY_IN_MONTH: week N is days 7(N-1)+1 to 7N of the month.
 *
 * A month can have a 5th or 6th week, but rules target weeks 1 to 4 only, so
 * those weeks never get weekOfMonth dates. Under FIRST_FULL_WEEK a 4th-week
 * date can fall past month end; the draft generator leaves it out of the draft
 * and lists it in a notice.
 */
export const WEEKS_OF_MONTH = [1, 2, 3, 4] as const;

export type WeekOfMonth = (typeof WEEKS_OF_MONTH)[number];

/** The shortest and longest cycle of an everyNWeeks rule, in weeks. */
export const MIN_INTERVAL_WEEKS = 2;
export const MAX_INTERVAL_WEEKS = 8;

/** One month of one year. The month field runs from 1 (January) to 12. */
export interface YearMonth {
  year: number;
  month: number;
}

/**
 * One rule of a CalendarEntryPattern. patternRuleSchema in rules.ts is its zod
 * twin.
 *
 * For everyNWeeks, intervalWeeks is MIN_INTERVAL_WEEKS to MAX_INTERVAL_WEEKS
 * and anchorDate falls on weekday.
 */
export type PatternRule =
  | { type: "weekOfMonth"; week: WeekOfMonth; weekday: Weekday }
  | { type: "everyWeekday"; weekday: Weekday }
  | {
      type: "everyNWeeks";
      weekday: Weekday;
      intervalWeeks: number;
      anchorDate: IsoDate;
    };

/** How "week N" in a weekOfMonth rule is counted. Same values as the Prisma CalendarWeekNumbering enum. */
export const WEEK_NUMBERINGS = [
  "FIRST_FULL_WEEK",
  "NTH_WEEKDAY_IN_MONTH",
] as const;

/**
 * FIRST_FULL_WEEK: week 1 is the first full week inside the month, starting on
 * weekStartsOn. NTH_WEEKDAY_IN_MONTH: week N is days 7(N-1)+1 to 7N, as in
 * RRULE's BYDAY=1TH.
 */
export type WeekNumbering = (typeof WEEK_NUMBERINGS)[number];

/** What publishing does with entries on holidays. Same values as the Prisma CalendarHolidayPolicy enum. */
export const HOLIDAY_POLICIES = ["WARN", "BLOCK"] as const;
export type HolidayPolicy = (typeof HOLIDAY_POLICIES)[number];

/**
 * A calendar's behaviour settings. Each state's code supplies them as a typed
 * constant; the Calendar row stores none of them (D36).
 */
export interface CalendarSettings {
  /** First day of a pattern week, e.g. "SUNDAY". */
  weekStartsOn: Weekday;
  /** How weekOfMonth rules count weeks. Has no default. */
  weekNumbering: WeekNumbering;
  /** IANA time zone that calendar dates are in, e.g. "America/Denver". */
  timezone: string;
  /** Holiday region, e.g. "US-CO". Null means the calendar shows no holidays. */
  holidayRegion: string | null;
  holidayPolicy: HolidayPolicy;
}

/** The settings that decide which date a weekOfMonth rule resolves to. */
export type WeekSettings = Pick<
  CalendarSettings,
  "weekStartsOn" | "weekNumbering"
>;

/** One date a pattern rule makes in a month. */
export interface PatternRuleDate {
  rule: PatternRule;
  date: IsoDate;
  /** False when a week-4 FIRST_FULL_WEEK date falls in the next month. */
  inMonth: boolean;
}
