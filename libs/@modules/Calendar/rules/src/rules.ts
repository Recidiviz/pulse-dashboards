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

import { z } from "zod";

import { parseIsoDate, weekdayOf } from "./dates";
import { CalendarRulesError } from "./errors";
import {
  MAX_INTERVAL_WEEKS,
  MIN_INTERVAL_WEEKS,
  PatternRule,
  WEEKDAYS,
  WeekOfMonth,
  WEEKS_OF_MONTH,
} from "./types";
import { describeZodIssues } from "./zodIssues";

const weekdaySchema = z.enum(WEEKDAYS);

function isIsoDate(value: string): boolean {
  try {
    return parseIsoDate(value) === value;
  } catch {
    return false;
  }
}

const isoDateSchema = z
  .string()
  .refine(isIsoDate, { message: "Expected a real YYYY-MM-DD date" });

const weekOfMonthRuleSchema = z
  .object({
    type: z.literal("weekOfMonth"),
    // z.custom keeps WeekOfMonth as the input type too, so tRPC callers get
    // a compile error for a week outside WEEKS_OF_MONTH.
    week: z.custom<WeekOfMonth>(
      (week) => (WEEKS_OF_MONTH as readonly unknown[]).includes(week),
      { message: `Expected one of ${WEEKS_OF_MONTH.join(", ")}` },
    ),
    weekday: weekdaySchema,
  })
  .strict();

const everyWeekdayRuleSchema = z
  .object({
    type: z.literal("everyWeekday"),
    weekday: weekdaySchema,
  })
  .strict();

const everyNWeeksRuleSchema = z
  .object({
    type: z.literal("everyNWeeks"),
    weekday: weekdaySchema,
    intervalWeeks: z
      .number()
      .int()
      .min(MIN_INTERVAL_WEEKS)
      .max(MAX_INTERVAL_WEEKS),
    anchorDate: isoDateSchema,
  })
  .strict();

/**
 * The zod schema for one PatternRule, and the only definition of a valid
 * rule: assertValidPatternRule and the stored rules column both check rules
 * with it. Unknown keys are rejected, and an everyNWeeks anchorDate must be a
 * real date on the rule's weekday.
 */
export const patternRuleSchema = z
  .discriminatedUnion("type", [
    weekOfMonthRuleSchema,
    everyWeekdayRuleSchema,
    everyNWeeksRuleSchema,
  ])
  .superRefine((rule, ctx) => {
    // zod still runs this refinement when isoDateSchema has already rejected
    // the anchor, so skip anchors that aren't real dates.
    if (rule.type !== "everyNWeeks" || !isIsoDate(rule.anchorDate)) return;
    const anchorWeekday = weekdayOf(rule.anchorDate);
    if (anchorWeekday !== rule.weekday) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anchorDate"],
        message: `${rule.anchorDate} is a ${anchorWeekday}, not a ${rule.weekday}`,
      });
    }
  });

/**
 * Throws INVALID_RULE, naming the rule and each failing field, unless rule
 * passes patternRuleSchema. An everyNWeeks anchorDate on the wrong weekday is
 * INVALID_RULE too, with a message such as
 * "anchorDate: 2026-09-05 is a SATURDAY, not a FRIDAY".
 */
export function assertValidPatternRule(rule: PatternRule): void {
  const result = patternRuleSchema.safeParse(rule);
  if (!result.success) {
    throw new CalendarRulesError(
      "INVALID_RULE",
      `Invalid pattern rule ${JSON.stringify(rule)}: ${describeZodIssues(result.error)}`,
    );
  }
}

/**
 * Returns a string that is equal for two valid rules exactly when their fields
 * are equal.
 *
 * Must not parse anchorDate: patternRulesSchema's repeat check still runs on
 * rules that failed patternRuleSchema, so a throw here would escape safeParse
 * instead of becoming an issue. Comparing the raw string is enough, because
 * patternRuleSchema only accepts anchors in canonical YYYY-MM-DD form.
 */
export function patternRuleKey(rule: PatternRule): string {
  switch (rule.type) {
    case "weekOfMonth":
      return `${rule.type}:${rule.week}:${rule.weekday}`;
    case "everyWeekday":
      return `${rule.type}:${rule.weekday}`;
    case "everyNWeeks":
      return `${rule.type}:${rule.weekday}:${rule.intervalWeeks}:${rule.anchorDate}`;
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
