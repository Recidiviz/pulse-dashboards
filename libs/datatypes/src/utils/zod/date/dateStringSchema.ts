// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { isValid, parseISO } from "date-fns";
import { z } from "zod";

import { shouldDateshift } from "./dateshift";
import { shiftFixtureDate } from "./fixtureDates";

/**
 * Regex for a plain YYYY-MM-DD date, which is what we expect date strings to be.
 */
const SIMPLE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Converts valid YYYY-MM-DD strings into Date objects.
 * Returns undefined if the input string is not a valid date.
 */
function parseSimpleDate(value: string): Date | undefined {
  const match = SIMPLE_DATE_RE.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  // the Date constructor silently rolls over out-of-range values
  // (e.g. Feb 30 -> Mar 2) but we will consider those invalid here
  // because they don't conform to ISO 8601
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/**
 * a Zod schema that will parse any valid ISO date string (date-only or with time)
 * into a Date object. Will fail if a valid Date cannot be derived from the input string.
 * Unlike the standard `dateStringSchema`, this will not apply a time shift in Demo or Offline mode.
 */
export const dateStringSchemaWithoutTimeShift = z
  .string()
  .transform((value, ctx) => {
    // Run against date-only regex first for speed. This should cover the vast majority of cases.
    // Fall back to `parseISO()` if it fails so we have full coverage.
    // This is still faster than zod's string().date() validator.
    const transformedDate = parseSimpleDate(value) ?? parseISO(value);
    if (isValid(transformedDate)) {
      return transformedDate;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.invalid_string,
      message: "Invalid ISO date string",
      validation: "datetime",
    });

    return z.NEVER;
  });

/**
 * a Zod schema that will parse any valid ISO date string (date-only or with time)
 * into a Date object. Will fail if a valid Date cannot be derived from the input string.
 * In Demo and Offline modes, will also apply a time shift so that the date (presumed to be
 * from fixture data) will be relevant to the current date.
 */
export const dateStringSchema = dateStringSchemaWithoutTimeShift.transform(
  (value) => {
    if (shouldDateshift()) {
      return shiftFixtureDate(value);
    }
    return value;
  },
);

/**
 * Helper function that parses an array of dates from the provided string and returns the array.
 * @param dates A list of 0 or more ISO-formatted date strings separated by commas
 */
export function toDateList(dates: string): Date[] {
  return dates.split(",").map((date) => dateStringSchema.parse(date.trim()));
}
