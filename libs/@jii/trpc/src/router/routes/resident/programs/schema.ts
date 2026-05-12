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

import { camelCase, isObject, mapKeys } from "lodash-es";
import { z } from "zod";

export const getProgramsInputSchema = z.object({
  pseudonymizedId: z.string(),
});

export const setStarredProgramInputSchema = z.object({
  pseudonymizedId: z.string(),
  programId: z.string(),
  title: z.string(),
  isStarred: z.boolean(),
});

export const programFromSheetSchema = z.preprocess(
  (row) => isObject(row) && mapKeys(row, (v, k) => camelCase(k)),
  z.object({
    dateAddedOrUpdated: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce.date().optional(),
    ),
    programId: z.string(),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    abbreviatedDescription: z.string().optional(),
    facilitiesOffered: z
      .string()
      .transform((raw) => raw.split(",").map((s) => s.trim())),
    numberOfDaysThatCanBeEarned: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce.number().optional(),
    ),
    eligibilityRequirements: z.string(),
    prerequisites: z.string().optional(),
  }),
);

export type ProgramFromSheet = z.output<typeof programFromSheetSchema>;
