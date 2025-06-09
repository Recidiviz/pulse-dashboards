// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { dateStringSchema } from "../../../../utils/zod";

export const usMaEarnedCreditType = z.enum([
  "EARNED_GOOD_TIME",
  "BOOST",
  "COMPLETION",
]);

const nullZeroNumberSchema = z
  .number()
  .nullable()
  .transform((i) => i ?? 0);

const creditValueSchema = z
  .number()
  // this union and additional validation is needed because unfortunately
  // the BigQuery JSON export renders integers as numbers and floats as strings
  .or(z.string())
  .nullish()
  .transform((i) => i ?? 0)
  .transform((input, ctx) => {
    const output = Number(input);
    if (isNaN(output)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a number",
      });
      return z.NEVER;
    }
    return output;
  });

const creditActivitySchema = z.object({
  creditDate: dateStringSchema,
  activity: z.string(),
  rating: z.string().nullable(),
  [usMaEarnedCreditType.enum.EARNED_GOOD_TIME]: creditValueSchema,
  [usMaEarnedCreditType.enum.BOOST]: creditValueSchema,
  [usMaEarnedCreditType.enum.COMPLETION]: creditValueSchema,
});

export const usMaResidentMetadataSchema = z.object({
  stateCode: z.literal("US_MA"),
  rtsDate: dateStringSchema.nullable(),
  adjustedMaxReleaseDate: dateStringSchema.nullable(),
  originalMaxReleaseDate: dateStringSchema.nullable(),
  totalCompletionCredit: nullZeroNumberSchema,
  totalCompletionCreditDaysCalculated: nullZeroNumberSchema,
  totalStateCredit: nullZeroNumberSchema,
  totalStateCreditDaysCalculated: nullZeroNumberSchema,
  creditActivity: z.array(creditActivitySchema),
  lastUpdatedDate: dateStringSchema,
});

/**
 * US_MA-specific data from the Recidiviz data platform about an incarcerated person
 */
export type UsMaResidentMetadata = z.output<typeof usMaResidentMetadataSchema>;

export type UsMaCreditActivity = z.infer<typeof creditActivitySchema>;

/**
 * US_MA-specific data in its raw form, as stored in Firestore
 */
export type RawUsMaResidentMetadata = z.input<
  typeof usMaResidentMetadataSchema
>;
