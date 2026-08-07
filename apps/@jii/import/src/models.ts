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

import { toTitleCase } from "@artsy/to-title-case";
import { mapValues } from "lodash-es";
import { z } from "zod";

import { findStateSchema } from "~@jii/schemas";
import {
  dateStringSchema,
  FullName,
  nullishAsNull,
  residentCommonSchema,
} from "~datatypes";

/*
 * Schemas in this file describe records that have already had the raw-export transformations
 * applied (see FILE_NAME_TO_SCHEMA_AND_LOADER_FN in constants.ts), so they can also be used
 * directly for fixture data that doesn't require them.
 */

export const rnaWritebackImportSchema = z.object({
  pseudonymizedId: z.string(),
  seqNumber: nullishAsNull(z.string()),
  opusId: z.string(),
  admitDate: dateStringSchema.nullable(),
});

// we'll use this to make sure no fields are missing when we spread the name blobs
const personNameDefaults: Record<keyof FullName, null> = {
  givenNames: null,
  middleNames: null,
  surname: null,
};

export const residentImportSchema = residentCommonSchema
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
            validation.error.issues.forEach((i) => ctx.addIssue(i));
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
  })
  .transform(
    ({
      personName,
      // removing stateCode from the final import payload, it's not part of the Prisma model
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stateCode,
      ...passthroughFields
    }) => {
      const personNameData = mapValues(
        // because we're spreading this into columns in the SQL query,
        // we have to make sure there are no missing fields, or we may get
        // a SQL syntax error in bulkUpdate
        { ...personNameDefaults, ...personName },
        // names come through in UPPERCASE which is not what we want to display
        // TODO(OBT-29534): switch to nameCase, but using titleCase here for comparison to old data
        (v) => (v ? toTitleCase(v.toLowerCase()) : v),
      );
      return { ...personNameData, ...passthroughFields };
    },
  );

export type ImportedResident = z.infer<typeof residentImportSchema>;

export const facilityImportSchema = z.object({
  id: z.string(),
  name: nullishAsNull(z.string()),
});
