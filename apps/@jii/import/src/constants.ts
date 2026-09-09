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

import { snakeCase } from "lodash-es";
import { z } from "zod";

import { type PrismaClient } from "~@jii/prisma";
import { type LoaderContext } from "~data-import-plugin";

import { facilityHandler } from "./handlers/facility/facility";
import { residentHandler } from "./handlers/resident/resident";
import { transformAndLoadRNAWritebackData } from "./handlers/usNcRNA/usNcRNA";
import {
  FACILITY_ID_FIELD,
  facilityImportSchema,
  RESIDENT_ID_FIELD,
  residentImportSchema,
  RNA_WRITEBACK_ID_FIELD,
  rnaWritebackImportSchema,
} from "./models";
import { camelCaseImportRecord } from "./utils/camelCaseImportRecord";
import { requireNonemptyString } from "./utils/requireNonemptyString";

// Filenames based on view_id values
// in https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/jii
export const NC_RNA_FILE_NAME = "us_nc_rna_writeback.json";
export const RESIDENTS_FILE_NAME = "resident.json";
export const FACILITY_FILE_NAME = "incarceration_facility.json";

// JSON columns are exported as strings and need to be parsed
const jsonStringToObjectSchema = z.string().transform((s) => JSON.parse(s));

/**
 * Pairs a model's schema with its loader, wrapping the schema in the transformations that
 * every raw BigQuery export requires: any per-column preprocessing this export needs
 * (`rawFieldSchemas`, keyed by raw column name), followed by camelCasing all keys. This lets
 * the schemas in models.ts describe only an already-transformed record, so that they can also
 * validate fixture data that doesn't require any of this.
 */
function rawExport<Schema extends z.ZodTypeAny>({
  schema,
  loaderFn,
  idField,
  rawFieldSchemas,
}: {
  schema: Schema;
  // spelled out rather than reusing LoaderFn<PrismaClient, Schema> so that the returned entry
  // only pins its schema type in one place: the wrapped schema. Naming Schema here too would
  // give the import handler a second, conflicting candidate when it infers that type.
  loaderFn: (
    prismaClient: PrismaClient,
    data: AsyncGenerator<z.infer<Schema>>,
    context: LoaderContext,
  ) => Promise<void>;
  /**
   * The field that identifies a record, which must be the one its loader imports by.
   * The schema should enforce that this string is nonempty! Empty ID strings, while unlikely in practice,
   * will cause the import job to abort if they make it into the database and may require manual resolution.
   */
  idField: keyof z.infer<Schema> & string;
  rawFieldSchemas?: z.ZodRawShape;
}) {
  return {
    schema: z
      .object(rawFieldSchemas ?? {})
      .passthrough()
      .transform(camelCaseImportRecord)
      .pipe(schema),
    loaderFn,
    getRowId: (rawDatum: unknown) => {
      // some minimal parsing just to make sure the raw data is an object
      const rawRecord = z.record(z.unknown()).safeParse(rawDatum);
      if (!rawRecord.success) return undefined;

      // the raw data is assumed to have keys in snake case, so we cast the ID field
      // (as opposed to doing a redundant conversion of the object)
      const snakeCaseIdField = snakeCase(idField);
      // valid IDs are nonempty strings. Returns undefined if invalid.
      try {
        return requireNonemptyString(rawRecord.data[snakeCaseIdField]);
      } catch {
        return undefined;
      }
    },
  };
}

export const FILE_NAME_TO_SCHEMA_AND_LOADER_FN = {
  [NC_RNA_FILE_NAME]: rawExport({
    schema: rnaWritebackImportSchema,
    loaderFn: transformAndLoadRNAWritebackData,
    idField: RNA_WRITEBACK_ID_FIELD,
  }),
  [RESIDENTS_FILE_NAME]: rawExport({
    schema: residentImportSchema,
    loaderFn: residentHandler,
    idField: RESIDENT_ID_FIELD,
    rawFieldSchemas: {
      person_name: jsonStringToObjectSchema,
      // not every state will have this, though we do expect it to exist consistently within a state
      state_specific_data: jsonStringToObjectSchema.optional(),
    },
  }),
  [FACILITY_FILE_NAME]: rawExport({
    schema: facilityImportSchema,
    loaderFn: facilityHandler,
    idField: FACILITY_ID_FIELD,
  }),
};
