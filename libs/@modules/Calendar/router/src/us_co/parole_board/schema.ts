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

import {
  ADD_MONTHS_AHEAD,
  MAX_YEAR,
  MIN_YEAR,
  patternRulesSchema,
} from "~@modules/Calendar/rules";
import { US_CO_PAROLE_BOARD_KIND_CODES } from "~@modules/Calendar/rules/us_co/parole_board";

/**
 * The inputs of Colorado's Public Calendar API. The router is fixed to
 * US_CO's PAROLE_BOARD_PUBLIC calendar, so no input names a state or a
 * calendar, and a kind is one of Colorado's entry types.
 */

const id = z.string().min(1).max(64);
const year = z.number().int().min(MIN_YEAR).max(MAX_YEAR);
const month = z.number().int().min(1).max(12);
const yearMonth = z.object({ year, month }).strict();
const expectedVersion = z.number().int().min(1);
const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm.");

/** One of Colorado's entry types. */
export const kindCodeInput = z.enum(US_CO_PAROLE_BOARD_KIND_CODES);

export const getMonthInput = z.object({ year, month }).strict();

/**
 * One page of months.list. Without a cursor, a page is centred on `around`
 * when it's set, and otherwise starts at the oldest month (direction
 * "forward") or the newest ("backward"). With a cursor, the page continues
 * from it, to later months going forward and earlier months going backward,
 * and leaves out the cursor's own month. The cursor wins over `around`, so a
 * client can keep `around` in the input for every page.
 *
 * direction takes tRPC's own values, so the infinite query hooks set it and
 * the cursor: fetchNextPage sends nextCursor going forward, and
 * fetchPreviousPage sends prevCursor going backward.
 *
 * `search` is free text such as "2026", "Oct", "October 2026" or "10/2026".
 * The server reads a year and a month from it, and text it can't read
 * matches no months rather than failing, so a half-typed query just shows
 * an empty list.
 */
export const listMonthsInput = z
  .object({
    cursor: yearMonth.optional(),
    limit: z.number().int().min(1).max(100).default(24),
    direction: z.enum(["forward", "backward"]).default("backward"),
    around: yearMonth.optional(),
    search: z.string().max(64).optional(),
  })
  .strict();

function noDuplicateMonths(months: { year: number; month: number }[]): boolean {
  const keys = months.map((m) => `${m.year}-${m.month}`);
  return new Set(keys).size === keys.length;
}

/**
 * The input of months.create. The Add month window is the current month and
 * the next ADD_MONTHS_AHEAD, so it holds ADD_MONTHS_AHEAD + 1 months at most.
 */
export const createMonthsInput = z
  .object({
    months: z
      .array(yearMonth)
      .min(1)
      .max(ADD_MONTHS_AHEAD + 1)
      .refine(noDuplicateMonths, "Pick each month once."),
  })
  .strict();

/** The input of publishPreview and unpublish. */
export const monthIdInput = z.object({ monthId: id }).strict();

export const publishMonthInput = z
  .object({ monthId: id, expectedRevision: z.number().int().min(1) })
  .strict();

export const addEntryInput = z
  .object({
    monthId: id,
    date: z.string().date(),
    kindCode: kindCodeInput,
    resourceId: id.nullable(),
  })
  .strict();

/** The input of delete, cancel and uncancel. */
export const entryVersionInput = z
  .object({ entryId: id, expectedVersion })
  .strict();

function noDuplicateEntries(entries: { entryId: string }[]): boolean {
  return new Set(entries.map((e) => e.entryId)).size === entries.length;
}

/**
 * The input of move: one entry, or several the editor selected, all going to
 * newDate together. 100 is well above the entries one month holds.
 */
export const moveEntriesInput = z
  .object({
    entries: z
      .array(z.object({ entryId: id, expectedVersion }).strict())
      .min(1)
      .max(100)
      .refine(noDuplicateEntries, "Each entry can move once."),
    newDate: z.string().date(),
  })
  .strict();

export const updatePatternInput = z
  .object({
    /** The kind whose pattern this saves. */
    kindCode: kindCodeInput,
    /** The resource whose pattern this saves, or null for a kind with no resource. */
    resourceId: id.nullable(),
    /** The slot's current pattern as the editor saw it, or null if it had none. */
    expectedPatternId: id.nullable(),
    rules: patternRulesSchema,
    startTime: hhmm.nullable(),
    endTime: hhmm.nullable(),
  })
  .strict()
  .refine(
    (v) =>
      v.endTime === null || (v.startTime !== null && v.endTime > v.startTime),
    { message: "End time needs an earlier start time.", path: ["endTime"] },
  );

/**
 * The input of the public read. Without a month, the server picks the
 * landing month; with one, it's "YYYY-MM".
 */
export const publicMonthInput = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM.")
      .refine((value) => {
        const yearOfMonth = Number(value.slice(0, 4));
        return yearOfMonth >= MIN_YEAR && yearOfMonth <= MAX_YEAR;
      }, `Use a year from ${MIN_YEAR} to ${MAX_YEAR}.`)
      .optional(),
  })
  .strict();
