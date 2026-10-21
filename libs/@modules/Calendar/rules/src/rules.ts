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
import { isWeekday, plainDateWeekday, toPlainDate } from "./plainDates";
import {
  MAX_INTERVAL_WEEKS,
  MIN_INTERVAL_WEEKS,
  PatternRule,
  WEEKS_OF_MONTH,
} from "./types";

/**
 * Throws INVALID_RULE unless rule is a well-formed PatternRule, and
 * ANCHOR_WEEKDAY_MISMATCH when an everyNWeeks anchor isn't on its weekday.
 */
export function assertValidPatternRule(rule: PatternRule): void {
  const invalid = (reason: string) =>
    new CalendarRulesError(
      "INVALID_RULE",
      `${reason}: ${JSON.stringify(rule)}`,
    );

  if (typeof rule !== "object" || rule === null) {
    throw invalid("Rule must be an object");
  }
  if (!isWeekday(rule.weekday)) {
    throw invalid("Unknown weekday");
  }
  switch (rule.type) {
    case "weekOfMonth":
      if (!(WEEKS_OF_MONTH as readonly number[]).includes(rule.week)) {
        throw invalid(`week must be one of ${WEEKS_OF_MONTH.join(", ")}`);
      }
      return;
    case "everyWeekday":
      return;
    case "everyNWeeks": {
      const { intervalWeeks } = rule;
      if (
        !Number.isInteger(intervalWeeks) ||
        intervalWeeks < MIN_INTERVAL_WEEKS ||
        intervalWeeks > MAX_INTERVAL_WEEKS
      ) {
        throw invalid(
          `intervalWeeks must be ${MIN_INTERVAL_WEEKS} to ${MAX_INTERVAL_WEEKS}`,
        );
      }
      const anchorWeekday = plainDateWeekday(toPlainDate(rule.anchorDate));
      if (anchorWeekday !== rule.weekday) {
        throw new CalendarRulesError(
          "ANCHOR_WEEKDAY_MISMATCH",
          `anchorDate ${rule.anchorDate} is a ${anchorWeekday}, not a ${rule.weekday}`,
        );
      }
      return;
    }
    default:
      throw invalid("Unknown rule type");
  }
}

/** Returns a string that is equal for two rules exactly when their fields are equal. */
function patternRuleKey(rule: PatternRule): string {
  switch (rule.type) {
    case "weekOfMonth":
      return `${rule.type}:${rule.week}:${rule.weekday}`;
    case "everyWeekday":
      return `${rule.type}:${rule.weekday}`;
    case "everyNWeeks":
      return `${rule.type}:${rule.weekday}:${rule.intervalWeeks}:${toPlainDate(rule.anchorDate).toString()}`;
  }
}

/**
 * Validates every rule and returns them with identical rules removed, keeping
 * the first of each in input order.
 */
export function uniquePatternRules(
  rules: readonly PatternRule[],
): PatternRule[] {
  const unique = new Map<string, PatternRule>();
  for (const rule of rules) {
    assertValidPatternRule(rule);
    const key = patternRuleKey(rule);
    if (!unique.has(key)) unique.set(key, rule);
  }
  return [...unique.values()];
}
