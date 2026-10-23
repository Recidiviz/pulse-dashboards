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

export {
  addMonths,
  currentYearMonth,
  daysInMonth,
  isDateInMonth,
  parseIsoDate,
  todayIn,
  weekdayOf,
} from "./dates";
export { describePatternRules } from "./describePattern";
export type { CalendarRulesErrorCode } from "./errors";
export { CalendarRulesError } from "./errors";
export { getHolidays } from "./holidays/getHolidays";
export { staticHolidaySource } from "./holidays/staticHolidaySource";
export type { DateRange, Holiday, HolidaySource } from "./holidays/types";
export { MAX_YEAR, MIN_YEAR } from "./plainDates";
export {
  everyNWeeksDates,
  everyWeekdayDates,
  expandPatternRules,
} from "./recurring";
export type { InvalidEntryReason } from "./storage/entries";
export {
  assertCancellable,
  assertEntryShape,
  entrySlotKey,
  InvalidEntryError,
} from "./storage/entries";
export { parsePatternRules, patternRulesSchema } from "./storage/patternRules";
export type {
  CalendarSettings,
  HolidayPolicy,
  IsoDate,
  PatternRule,
  PatternRuleDate,
  Weekday,
  WeekNumbering,
  WeekOfMonth,
  WeekSettings,
  YearMonth,
} from "./types";
export {
  HOLIDAY_POLICIES,
  MAX_INTERVAL_WEEKS,
  MIN_INTERVAL_WEEKS,
  WEEK_NUMBERINGS,
  WEEKDAYS,
  WEEKS_OF_MONTH,
} from "./types";
export { firstFullWeekStart, resolvePatternRule } from "./weeks";
