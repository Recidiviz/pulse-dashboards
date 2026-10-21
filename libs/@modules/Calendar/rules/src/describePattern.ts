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

import { toPlainDate } from "./plainDates";
import { uniquePatternRules } from "./rules";
import { PatternRule, Weekday, WEEKDAYS } from "./types";

type WeekOfMonthRule = Extract<PatternRule, { type: "weekOfMonth" }>;

const ORDINALS = ["1st", "2nd", "3rd", "4th"] as const;

// A fixed table rather than toLocaleString, so the text is the same on every
// server and browser whatever its locale or ICU data.
const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function isFullGrid(rules: readonly WeekOfMonthRule[]): boolean {
  if (rules.length === 0) return false;
  const weeks = new Set(rules.map((rule) => rule.week));
  const weekdays = new Set(rules.map((rule) => rule.weekday));
  // The rules are unique, so they cover every week and weekday pair exactly
  // when there are as many rules as pairs.
  return rules.length === weeks.size * weekdays.size;
}

function uniqueSorted(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function ordinal(week: number): string {
  return ORDINALS[week - 1];
}

/** "MONDAY" becomes "Monday". */
function weekdayName(weekday: Weekday): string {
  return weekday.charAt(0) + weekday.slice(1).toLowerCase();
}

/** "A", "A and B", "A, B and C". */
function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "2026-09-04" becomes "Sep 4, 2026". */
function formatShortDate(isoDate: string): string {
  const date = toPlainDate(isoDate);
  return `${MONTH_ABBREVIATIONS[date.month - 1]} ${date.day}, ${date.year}`;
}

function describeRule(rule: PatternRule): string {
  switch (rule.type) {
    case "weekOfMonth":
      return `${ordinal(rule.week)} ${weekdayName(rule.weekday)}`;
    case "everyWeekday":
      return `Every ${weekdayName(rule.weekday)}`;
    case "everyNWeeks":
      return `Every ${rule.intervalWeeks} weeks on ${weekdayName(rule.weekday)} from ${formatShortDate(rule.anchorDate)}`;
  }
}

/**
 * Returns the text the patterns list shows for a pattern's rules.
 *
 * Week-of-month rules that form a full grid, where every listed week has the
 * same weekdays, print the weeks and then the weekdays:
 *   1st and 2nd Monday
 *   2nd Tuesday and Wednesday
 * Any other mix prints each rule, comma separated, weekOfMonth rules first in
 * week then weekday order:
 *   1st Monday, 2nd Tuesday
 *   2nd Monday, Every Friday
 *   Every 3 weeks on Friday from Sep 4, 2026
 * Duplicate rules print once, and an empty list prints "".
 */
export function describePatternRules(rules: readonly PatternRule[]): string {
  const unique = uniquePatternRules(rules);
  const weekRules = unique
    .filter((rule): rule is WeekOfMonthRule => rule.type === "weekOfMonth")
    .sort(
      (a, b) =>
        a.week - b.week ||
        WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday),
    );

  if (weekRules.length === unique.length && isFullGrid(weekRules)) {
    const weeks = uniqueSorted(weekRules.map((rule) => rule.week));
    const weekdays = uniqueSorted(
      weekRules.map((rule) => WEEKDAYS.indexOf(rule.weekday)),
    ).map((index) => WEEKDAYS[index]);
    return `${joinWithAnd(weeks.map(ordinal))} ${joinWithAnd(weekdays.map(weekdayName))}`;
  }

  const everyWeekdayRules = unique
    .filter((rule) => rule.type === "everyWeekday")
    .sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday));
  const everyNWeeksRules = unique.filter((rule) => rule.type === "everyNWeeks");
  return [...weekRules, ...everyWeekdayRules, ...everyNWeeksRules]
    .map(describeRule)
    .join(", ");
}
