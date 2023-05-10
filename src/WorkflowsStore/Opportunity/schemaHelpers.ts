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
import { z } from "zod";

import { fieldToDate } from "../utils";

export const dateStringSchema = z.string().transform(fieldToDate);

export const stringToIntSchema = z.string().transform((s) => parseInt(s));

export function NullCoalesce<T extends z.ZodTypeAny>(
  fallback: z.input<T>,
  schema: T
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
