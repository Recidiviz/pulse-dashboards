// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { Dictionary, mapKeys, toUpper } from "lodash";
import { z } from "zod";

import { FullName } from "../../core/types/personMetadata";

export const targetStatusSchema = z.enum(["FAR", "NEAR", "MET"]);
export type TargetStatus = z.infer<typeof targetStatusSchema>;

// zod has a built-in datetime validator but it does not yet support date-only strings
// (see https://github.com/colinhacks/zod/issues/1676)
export const dateStringSchema = z.string().transform((value, ctx) => {
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

export const fullNameSchema = z.object({
  givenNames: z.string().optional(),
  middleNames: z.string().optional(),
  surname: z.string().optional(),
});

export function uppercaseSchemaKeys<Schema extends z.ZodTypeAny>(
  schema: Schema
) {
  return z.preprocess(
    // we expect the backend to have transformed all keys into camel case;
    // uppercasing them should make them conform to the status enum
    (input) => mapKeys(input as Dictionary<unknown>, (v, k) => toUpper(k)),
    schema
  );
}

export function addDisplayName<T>(
  obj: T & {
    fullName: FullName;
  }
) {
  return {
    ...obj,
    displayName: [
      obj.fullName.givenNames,
      obj.fullName.middleNames,
      obj.fullName.surname,
    ]
      .filter((n) => Boolean(n))
      .join(" "),
  };
}
