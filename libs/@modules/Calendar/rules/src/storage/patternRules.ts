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

/**
 * The stored form of a CalendarEntryPattern's rules. CalendarEntryPattern.rules
 * is an untyped JSON column, and every read and write of it goes through
 * patternRulesSchema or parsePatternRules. Each rule is checked with
 * patternRuleSchema from rules.ts, the library's one definition of a valid
 * rule, so a new rule type is a new union member there and needs no migration.
 *
 * Callers parse the column on every write and every read (Spec D, D20). A
 * failed parse on read means the stored row is bad, not the request, so the
 * API returns PRECONDITION_FAILED for it rather than BAD_REQUEST.
 */

import { z } from "zod";

import { CalendarRulesError } from "../errors";
import { patternRuleKey, patternRuleSchema } from "../rules";
import { PatternRule, WEEKDAYS, WEEKS_OF_MONTH } from "../types";
import { describeZodIssues } from "../zodIssues";

/** Every week and weekday combination (28), the most a pattern can need. */
const MAX_RULES = WEEKS_OF_MONTH.length * WEEKDAYS.length;

/**
 * The zod schema for a pattern's rules: 1 to 28 rules with no repeats. The API
 * uses it for pattern input; storage code reads and writes the column through
 * parsePatternRules.
 */
export const patternRulesSchema = z
  .array(patternRuleSchema)
  .min(1)
  .max(MAX_RULES)
  .superRefine((rules, ctx) => {
    const seen = new Set<string>();
    rules.forEach((rule, index) => {
      const key = patternRuleKey(rule);
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Repeats an earlier rule",
        });
      }
      seen.add(key);
    });
  });

/**
 * Parses a CalendarEntryPattern.rules value. Throws INVALID_RULE, naming each
 * failing path, when it isn't a valid list of rules.
 */
export function parsePatternRules(json: unknown): PatternRule[] {
  const result = patternRulesSchema.safeParse(json);
  if (!result.success) {
    throw new CalendarRulesError(
      "INVALID_RULE",
      `Invalid pattern rules: ${describeZodIssues(result.error)}`,
    );
  }
  return result.data;
}
