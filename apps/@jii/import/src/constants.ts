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

import { type PrismaClient } from "~@jii/prisma";
import { camelCaseObject } from "~utils";

import { facilityHandler } from "./handlers/facility/facility";
import { residentHandler } from "./handlers/resident/resident";
import { transformAndLoadRNAWritebackData } from "./handlers/usNcRNA/usNcRNA";
import { facilitySchema, residentSchema, rnaWritebackSchema } from "./models";

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
  rawFieldSchemas,
}: {
  schema: Schema;
  // spelled out rather than reusing LoaderFn<PrismaClient, Schema> so that the returned entry
  // only pins its schema type in one place: the wrapped schema. Naming Schema here too would
  // give the import handler a second, conflicting candidate when it infers that type.
  loaderFn: (
    prismaClient: PrismaClient,
    data: AsyncGenerator<z.infer<Schema>>,
  ) => Promise<void>;
  rawFieldSchemas?: z.ZodRawShape;
}) {
  return {
    schema: z
      .object(rawFieldSchemas ?? {})
      .passthrough()
      .transform(camelCaseObject)
      .pipe(schema),
    loaderFn,
  };
}

export const FILE_NAME_TO_SCHEMA_AND_LOADER_FN = {
  [NC_RNA_FILE_NAME]: rawExport({
    schema: rnaWritebackSchema,
    loaderFn: transformAndLoadRNAWritebackData,
  }),
  [RESIDENTS_FILE_NAME]: rawExport({
    schema: residentSchema,
    loaderFn: residentHandler,
    rawFieldSchemas: {
      person_name: jsonStringToObjectSchema,
      // not every state will have this, though we do expect it to exist consistently within a state
      state_specific_data: jsonStringToObjectSchema.optional(),
    },
  }),
  [FACILITY_FILE_NAME]: rawExport({
    schema: facilitySchema,
    loaderFn: facilityHandler,
  }),
};
