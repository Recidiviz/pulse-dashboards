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

import { findStateSchema } from "~@jii/schemas";
import { dateStringSchema, residentCommonSchema } from "~datatypes";

import { camelCaseObject } from "./utils/camelCaseObject";

export const rnaWritebackSchema = z.object({
  pseudonymized_id: z.string(),
  seq_number: z.string().nullish(),
  opus_id: z.string(),
  admit_date: dateStringSchema.nullable(),
});

// JSON fields are exported as strings and need to be parsed
const jsonStringToObjectSchema = z.string().transform((s) => JSON.parse(s));

const exportPreprocessSchema = z
  .object({
    person_name: jsonStringToObjectSchema,
    // not every state will have this, though we do expect it to exist consistently within a state
    state_specific_data: jsonStringToObjectSchema.optional(),
  })
  .passthrough()
  .transform(camelCaseObject);

/**
 * schema for Resident data that has already passed through the BigQuery preprocessing step
 * (or that comes from a fixture file that does not require it)
 */
export const processedResidentSchema = residentCommonSchema
  .extend({
    // this is a plain object with passthrough because our goal here is to validate it
    // against existing SSD schemas while still storing the original input in the DB.
    // we do this because it will be parsed again at read time for type safety
    // and this simplifies that process (e.g. we don't have to have separate output schemas
    // to account for transformations). Because writes and reads are separated in time,
    // it is still possible for schema changes to cause errors at read time, but the benefits
    // of catching schema violations at ETL time will hopefully outweigh that drawback
    stateSpecificData: z
      .object({})
      .passthrough()
      .superRefine((rawSSD, ctx) => {
        // should be a safe assertion because of how these inputs are created in BQ
        const stateCode = rawSSD["stateCode"] as string;

        // because we are indexing with an unknown string, it could be undefined
        const ssdSchema = findStateSchema(stateCode);

        if (ssdSchema) {
          // for states where we do have a schema, validate the input against that
          const validation = ssdSchema.safeParse(rawSSD);
          if (validation.error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: validation.error.message,
            });
          }
        }
      })
      // not every state necessarily needs to have SSD.
      // store an empty object to satisfy DB requirements
      .default({}),
  })
  .superRefine((d, ctx) => {
    // if there's an SSD schema for this state, all residents must have SSD.
    // the actual validity of the SSD is checked by the field schema, we just need
    // to catch data that's completely missing here because that cannot be verified
    // at the field level
    const stateSchema = findStateSchema(d.stateCode);
    if (!stateSchema) return;
    if (d.stateCode !== d.stateSpecificData["stateCode"]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing required state-specific data for ${d.stateCode}`,
      });
    }
  });

export const residentSchema = exportPreprocessSchema.pipe(
  processedResidentSchema,
);
