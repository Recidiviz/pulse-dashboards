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

export const usMaEarnedCreditTypes = z.enum([
  // TODO(#44130): Fix ETL Error
  "EARNEDGoodTime",
  "BOOST",
  "COMPLETION",
]);

export type UsMaEarnedCreditType = z.infer<typeof usMaEarnedCreditTypes>;

/**
 * Accepts either a number or a decimal in string form and casts it to a Number.
 * (DO NOT USE for cases where null or undefined has a more specific meaning!)
 *
 */
const numberRepresentationSchema = z
  .number()
  // this union and additional validation is needed because unfortunately
  // the BigQuery JSON export renders integers as numbers and floats as strings
  .or(z.string())
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

/**
 * Applies {@link numberRepresentationSchema} while casting nullish values to zero.
 */
const nullZeroFloatSchema = numberRepresentationSchema
  .nullish()
  .transform((i) => i ?? 0);

const activityRating = z.enum(["S", "U", "I"]);

export const creditActivitySchema = z.object({
  creditDate: dateStringSchema,
  activity: z.string().nullable(),
  rating: z
    .string()
    .nullable()
    .transform((rating) => {
      // cast unexpected values to null to avoid parse failures
      try {
        return activityRating.parse(rating);
      } catch {
        return null;
      }
    }),
  [usMaEarnedCreditTypes.enum.EARNEDGoodTime]: nullZeroFloatSchema,
  [usMaEarnedCreditTypes.enum.BOOST]: nullZeroFloatSchema,
  [usMaEarnedCreditTypes.enum.COMPLETION]: nullZeroFloatSchema,
});

export const usMaResidentMetadataSchema = z.object({
  stateCode: z.literal("US_MA"),
  isEgtDisabled: z.boolean().nullish(),
  rtsDate: dateStringSchema.nullable(),
  adjustedMaxReleaseDate: dateStringSchema.nullable(),
  originalMaxReleaseDate: dateStringSchema.nullable(),
  totalCompletionCredit: nullZeroFloatSchema,
  totalCompletionCreditDaysCalculated: nullZeroFloatSchema,
  totalStateCredit: nullZeroFloatSchema,
  totalStateCreditDaysCalculated: nullZeroFloatSchema,
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
