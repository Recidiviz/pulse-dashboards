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

import { CalendarRulesError } from "./errors";
import { firstOfMonth, isWeekday, nextOnOrAfter } from "./plainDates";
import { assertValidPatternRule } from "./rules";
import {
  IsoDate,
  PatternRule,
  Weekday,
  WeekOfMonth,
  WeekSettings,
  YearMonth,
} from "./types";

function firstFullWeekStartDate(
  ym: YearMonth,
  weekStartsOn: Weekday,
): Temporal.PlainDate {
  if (!isWeekday(weekStartsOn)) {
    throw new CalendarRulesError(
      "INVALID_RULE",
      `Unknown weekStartsOn ${JSON.stringify(weekStartsOn)}`,
    );
  }
  return nextOnOrAfter(firstOfMonth(ym), weekStartsOn);
}

/** Returns the first date that week can hold a weekOfMonth date. */
function weekStart(
  ym: YearMonth,
  week: WeekOfMonth,
  { weekStartsOn, weekNumbering }: WeekSettings,
): Temporal.PlainDate {
  const daysBeforeWeek = (week - 1) * 7;
  switch (weekNumbering) {
    case "FIRST_FULL_WEEK":
      return firstFullWeekStartDate(ym, weekStartsOn).add({
        days: daysBeforeWeek,
      });
    case "NTH_WEEKDAY_IN_MONTH":
      return firstOfMonth(ym).add({ days: daysBeforeWeek });
    default:
      throw new CalendarRulesError(
        "INVALID_RULE",
        `Unknown weekNumbering ${JSON.stringify(weekNumbering)}`,
      );
  }
}

/**
 * Returns the first day of the month's first full week: the first date on or
 * after the 1st whose weekday is weekStartsOn.
 *
 * October 2026 starts on a Thursday, so with Sunday weeks its first full week
 * starts on 2026-10-04, and with Monday weeks on 2026-10-05.
 */
export function firstFullWeekStart(
  ym: YearMonth,
  weekStartsOn: Weekday,
): IsoDate {
  return firstFullWeekStartDate(ym, weekStartsOn).toString();
}

/**
 * Returns the date a weekOfMonth rule makes in a month.
 *
 * With FIRST_FULL_WEEK, week 1 is the month's first full week starting on
 * weekStartsOn, so in October 2026 with Sunday weeks the 1st Thursday is
 * 2026-10-08, not Oct 1. A week-4 date can fall in the next month. With
 * NTH_WEEKDAY_IN_MONTH, week N is days 7(N-1)+1 to 7N, so the 1st Thursday of
 * October 2026 is 2026-10-01; the date is always in the month and weekStartsOn
 * is ignored.
 *
 * Never clamps or skips a date: a date past month end is returned as is, so
 * each caller decides what to do with it, and expandPatternRules flags it
 * with inMonth false.
 *
 * Throws INVALID_RULE for a malformed rule, including another rule type from
 * a caller that skips the type check.
 */
export function resolvePatternRule(
  ym: YearMonth,
  rule: Extract<PatternRule, { type: "weekOfMonth" }>,
  settings: WeekSettings,
): IsoDate {
  assertValidPatternRule(rule);
  if (rule.type !== "weekOfMonth") {
    throw new CalendarRulesError(
      "INVALID_RULE",
      `resolvePatternRule only takes weekOfMonth rules, got ${(rule as PatternRule).type}`,
    );
  }
  return nextOnOrAfter(
    weekStart(ym, rule.week, settings),
    rule.weekday,
  ).toString();
}
