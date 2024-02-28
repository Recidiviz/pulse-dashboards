// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { mapKeys } from "lodash";
import { z } from "zod";

import { fieldToDate } from "../utils";

export const dateStringSchema = z.string().transform(fieldToDate);

export const eligibleDateSchema = z.object({ eligibleDate: dateStringSchema });

export const stringToIntSchema = z.string().transform((s) => parseInt(s));

export function NullCoalesce<T extends z.ZodTypeAny>(
  fallback: z.input<T>,
  schema: T,
) {
  return z.preprocess((val) => val ?? fallback, schema) as z.ZodEffects<
    T,
    z.output<T>,
    z.input<T> | null
  >;
}

export const opportunitySchemaBase = z.object({
  stateCode: z.string(),
  externalId: z.string(),
});

const caseNoteSchema = z
  .object({
    noteTitle: z.string().nullable(),
    noteBody: z.string().nullable(),
    eventDate: dateStringSchema.nullable(),
  })
  .partial();

export const caseNotesSchema = z.object({
  caseNotes: z.record(z.array(caseNoteSchema)).default({}),
});

/**
 * Criteria are overlapping objects; keyof Ineligible is presumed to be a subset of
 * keyof Eligible, but the value of overlapping keys may differ, in which case
 * they will be unioned.
 */
export type MergedCriteria<Eligible, Ineligible> = {
  [EK in keyof Eligible]:
    | Eligible[EK]
    | (EK extends keyof Ineligible ? Ineligible[EK] : never);
};
/**
 * Renames all occurrences of the keys in `obj` that are present as a key in `oldToNewKeyMapping`.
 * @param obj The object to be renamed.
 * @param oldToNewKeyMapping Mapping of keys to be renamed. The keys of this object are the old keys, and the values are the new keys.
 * @returns The object with the renamed keys.
 */
export function renameObjectKeys<
  T extends object,
  M extends Partial<Record<keyof T, string>>,
>(oldToNewKeyMapping: M) {
  return function (obj: T) {
    return mapKeys(
      obj,
      (_, k) => oldToNewKeyMapping[k as keyof T] ?? k,
    ) as Omit<T, keyof M>;
  };
}
