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
 * The contract for a state's stored calendar rows: the Calendar's identity,
 * resource types, resources, entry kind rows and patterns. Each state's
 * reference data parses with calendarConfigSchema, and nothing here names a
 * state. The calendar's behaviour settings and each entry type's behaviour
 * (whether it needs a resource, can be cancelled or deleted, is public and
 * counts toward totals) are the state's own code, not rows, so they're not
 * part of this contract (D36).
 */

import { z } from "zod";

import { CalendarRulesError } from "../errors";
import { describeZodIssues } from "../zodIssues";
import { entrySlotKey, isSlotKeyCode } from "./entries";
import { patternRulesSchema } from "./patternRules";

/** "HH:mm" on a 24-hour clock, so two times compare correctly as strings. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Every code can be part of a slotKey, e.g. "HEARING:FCF", so it uses the same
 * rule as entrySlotKey. Rejecting a bad code here reports the code itself, not
 * only the first pattern that uses it.
 */
const codeSchema = z.string().refine(isSlotKeyCode, {
  message: "Expected a non-empty code with no colon",
});
const timeSchema = z
  .string()
  .regex(TIME_PATTERN, { message: "Expected HH:mm" })
  .nullable();

/**
 * The Calendar row: its code and name, all it stores. Each state has its own
 * database, so the row has no stateCode (D37).
 */
const calendarSchema = z
  .object({
    code: codeSchema,
    name: z.string().min(1),
  })
  .strict();

const resourceTypeSchema = z
  .object({
    code: codeSchema,
    label: z.string().min(1),
    sortOrder: z.number().int(),
  })
  .strict();

const resourceSchema = z
  .object({
    code: codeSchema,
    typeCode: codeSchema,
    label: z.string().min(1),
    name: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
  })
  .strict();

/**
 * An entry kind row. The row exists so entries and patterns can reference
 * their kind with a calendar-scoped foreign key; the kind's behaviour is the
 * state's entry-type list in code (D36).
 */
const kindSchema = z
  .object({
    code: codeSchema,
    label: z.string().min(1),
    sortOrder: z.number().int(),
  })
  .strict();

const patternSchema = z
  .object({
    kindCode: codeSchema,
    resourceCode: codeSchema.nullable(),
    rules: patternRulesSchema,
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .strict()
  .superRefine(({ startTime, endTime }, ctx) => {
    if (endTime !== null && (startTime === null || startTime >= endTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "endTime needs a startTime that comes before it",
      });
    }
  });

/** Adds an issue for every code that repeats an earlier one in rows. */
function checkUniqueCodes(
  rows: readonly { code: string }[],
  listName: string,
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  rows.forEach(({ code }, index) => {
    if (seen.has(code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [listName, index, "code"],
        message: `Duplicate code ${code}`,
      });
    }
    seen.add(code);
  });
}

/**
 * The zod schema for a state's stored calendar rows, and the only definition
 * of them. Beyond each row's own fields, it checks that codes are unique, that
 * every typeCode, kindCode and resourceCode names a row in the configuration,
 * and that patterns have distinct slot keys. Whether a pattern's kind needs a
 * resource depends on the state's entry types, so the state's own test checks
 * each pattern with assertEntryShape.
 */
export const calendarConfigSchema = z
  .object({
    calendar: calendarSchema,
    resourceTypes: z.array(resourceTypeSchema),
    resources: z.array(resourceSchema),
    kinds: z.array(kindSchema),
    patterns: z.array(patternSchema),
  })
  .strict()
  .superRefine((config, ctx) => {
    checkUniqueCodes(config.resourceTypes, "resourceTypes", ctx);
    checkUniqueCodes(config.resources, "resources", ctx);
    checkUniqueCodes(config.kinds, "kinds", ctx);

    const typeCodes = new Set(config.resourceTypes.map(({ code }) => code));
    config.resources.forEach(({ typeCode }, index) => {
      if (!typeCodes.has(typeCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["resources", index, "typeCode"],
          message: `Unknown resource type ${typeCode}`,
        });
      }
    });

    const kindCodes = new Set(config.kinds.map(({ code }) => code));
    const resourceCodes = new Set(config.resources.map(({ code }) => code));
    const slotKeys = new Set<string>();
    config.patterns.forEach((pattern, index) => {
      const path = ["patterns", index];
      if (!kindCodes.has(pattern.kindCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "kindCode"],
          message: `Unknown kind ${pattern.kindCode}`,
        });
        return;
      }
      if (
        pattern.resourceCode !== null &&
        !resourceCodes.has(pattern.resourceCode)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "resourceCode"],
          message: `Unknown resource ${pattern.resourceCode}`,
        });
        return;
      }
      // zod still runs this refinement when codeSchema has already rejected a
      // code, so skip patterns with a bad code before entrySlotKey throws on it.
      if (
        !isSlotKeyCode(pattern.kindCode) ||
        (pattern.resourceCode !== null && !isSlotKeyCode(pattern.resourceCode))
      ) {
        return;
      }
      const slotKey = entrySlotKey(pattern);
      if (slotKeys.has(slotKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: `Another pattern already has slot key ${slotKey}`,
        });
      }
      slotKeys.add(slotKey);
    });
  });

/** A parsed calendar configuration. */
export type CalendarConfig = z.infer<typeof calendarConfigSchema>;

/**
 * Parses a state's stored calendar rows. Throws INVALID_SETTINGS, naming each
 * failing path.
 */
export function parseCalendarConfig(json: unknown): CalendarConfig {
  const result = calendarConfigSchema.safeParse(json);
  if (!result.success) {
    throw new CalendarRulesError(
      "INVALID_SETTINGS",
      `Invalid calendar configuration: ${describeZodIssues(result.error)}`,
    );
  }
  return result.data;
}
