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

import { isDemoMode, isOfflineMode } from "~client-env-utils";

import { shiftFixtureDate } from "./fixtureDates";

/**
 * a Zod schema that will parse any valid ISO date string (date-only or with time)
 * into a Date object. Will fail if a valid Date cannot be derived from the input string.
 * Unlike the standard `dateStringSchema`, this will not apply a time shift in Demo or Offline mode.
 */
export const dateStringSchemaWithoutTimeShift = z
  .string()
  .transform((value, ctx) => {
    // zod has a built-in datetime validator but it does not yet support date-only strings
    // (see https://github.com/colinhacks/zod/issues/1676)
    const transformedDate = parseISO(value);
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
    if (isDemoMode() || isOfflineMode()) {
      return shiftFixtureDate(value);
    }
    return value;
  },
);
