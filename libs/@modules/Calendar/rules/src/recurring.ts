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

import { isDateInMonth } from "./dates";
import { firstOfMonth, nextOnOrAfter, toPlainDate } from "./plainDates";
import { assertValidPatternRule, uniquePatternRules } from "./rules";
import {
  IsoDate,
  PatternRule,
  PatternRuleDate,
  WeekSettings,
  YearMonth,
} from "./types";
import { resolvePatternRule } from "./weeks";

function datesInMonthFrom(
  ym: YearMonth,
  start: Temporal.PlainDate,
  stepDays: number,
): IsoDate[] {
  const dates: IsoDate[] = [];
  for (
    let date = start;
    date.month === ym.month && date.year === ym.year;
    date = date.add({ days: stepDays })
  ) {
    dates.push(date.toString());
  }
  return dates;
}

/**
 * Returns every date in the month that falls on weekday, in order. For
 * FRIDAY in September 2026: 2026-09-04, 2026-09-11, 2026-09-18, 2026-09-25.
 */
export function everyWeekdayDates(
  ym: YearMonth,
  rule: Extract<PatternRule, { type: "everyWeekday" }>,
): IsoDate[] {
  assertValidPatternRule(rule);
  return datesInMonthFrom(ym, nextOnOrAfter(firstOfMonth(ym), rule.weekday), 7);
}

/**
 * Returns every date in the month whose distance from anchorDate is a whole
 * number of intervalWeeks-week cycles, before or after the anchor. The cycle
 * runs across months, so it isn't "the 3rd Friday of the month". The anchor
 * only fixes which weeks are on the cycle; it isn't a start date, so months
 * before it get dates too.
 *
 * Every 3 weeks on FRIDAY from 2026-09-04 gives 2026-09-04 and 2026-09-25 in
 * September, 2026-10-16 in October, and 2026-08-14 in August.
 *
 * Throws INVALID_RULE when intervalWeeks is outside MIN_INTERVAL_WEEKS to
 * MAX_INTERVAL_WEEKS, and ANCHOR_WEEKDAY_MISMATCH when anchorDate isn't on
 * weekday.
 */
export function everyNWeeksDates(
  ym: YearMonth,
  rule: Extract<PatternRule, { type: "everyNWeeks" }>,
): IsoDate[] {
  assertValidPatternRule(rule);
  const { weekday, intervalWeeks, anchorDate } = rule;
  const cycleDays = intervalWeeks * 7;
  const firstWeekday = nextOnOrAfter(firstOfMonth(ym), weekday);
  const daysFromAnchor = toPlainDate(anchorDate).until(firstWeekday).days;
  // Both dates fall on weekday, so this lands on weekday too. The double modulo
  // handles months before the anchor, where daysFromAnchor is negative.
  const daysToCycle = ((-daysFromAnchor % cycleDays) + cycleDays) % cycleDays;
  return datesInMonthFrom(
    ym,
    firstWeekday.add({ days: daysToCycle }),
    cycleDays,
  );
}

function ruleDates(
  ym: YearMonth,
  rule: PatternRule,
  settings: WeekSettings,
): IsoDate[] {
  switch (rule.type) {
    case "weekOfMonth":
      return [resolvePatternRule(ym, rule, settings)];
    case "everyWeekday":
      return everyWeekdayDates(ym, rule);
    case "everyNWeeks":
      return everyNWeeksDates(ym, rule);
  }
}

/**
 * Returns every date each rule makes in the month, for all rule types, sorted
 * by date. Identical rules collapse to one, and dates two different rules
 * make on one day both appear.
 *
 * inMonth is false only for a week-4 weekOfMonth date under FIRST_FULL_WEEK
 * that falls in the next month, e.g. the 4th Thursday of September 2026 with
 * Sunday weeks is 2026-10-01.
 */
export function expandPatternRules(
  ym: YearMonth,
  rules: readonly PatternRule[],
  settings: WeekSettings,
): PatternRuleDate[] {
  const rows: PatternRuleDate[] = [];
  for (const rule of uniquePatternRules(rules)) {
    for (const date of ruleDates(ym, rule, settings)) {
      rows.push({ rule, date, inMonth: isDateInMonth(date, ym) });
    }
  }
  // ISO dates sort as strings, and the sort is stable, so same-day rows keep
  // rule order.
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
