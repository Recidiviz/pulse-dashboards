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

/**
 * Returns an ID string from a raw data row (or undefined if there is no usable ID)
 */
export type GetRowId = (rawDatum: unknown) => string | undefined;

/**
 * Used to track rows that cannot be successfully read and transformed from GCS,
 * to pass this information on to the loader function, which doesn't otherwise know
 * about these rows.
 */
export type LoaderContext = {
  /**
   * Ids of unparsable rows, per the file's `getRowId`. Always empty for a file that doesn't
   * provide one.
   */
  skippedRowIds: Set<string>;
  /**
   * How many unparsable rows yielded no usable id. A loader that deletes records missing from
   * the import can't tell those rows apart from records that are genuinely gone, so any count
   * above zero means it should not delete anything on this run.
   */
  unidentifiedSkippedRowCount: number;
};

export type LoaderFn<T, U extends z.ZodTypeAny> = (
  prismaClient: T,
  data: AsyncGenerator<z.infer<U>>,
  context: LoaderContext,
) => Promise<void>;

interface ZodSchemaAndLoaderFn<T, U extends z.ZodTypeAny> {
  schema: U;
  loaderFn: LoaderFn<T, U>;
  /**
   * Provide this for any file whose loader deletes records that the latest import
   * doesn't contain, so that it can tell a missing record apart from an unparsable one.
   */
  getRowId?: GetRowId;
}

// This type is a generic that is inferred from the provided ZodSchemaAndLoaderFns
export type FilesToSchemasAndLoaderFns<T, M> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Need this infer so the types are correctly inferred
  [key: string]: M extends ZodSchemaAndLoaderFn<T, infer _U> ? M : never;
};

/*
 * Props for the ImportHandlerBase class.
 * @property bucket - The name of the bucket to import from.
 * @property getPrismaClientForStateCode - A function that returns a PrismaClient for a given state code. This is used to determine if a state is supported and to pass the client to the loader functions.
 * @property filesToSchemasAndLoaderFns - An object that maps file names to Zod schemas and loader functions. All of the files provided will be imported when import() is called.
 */
export type Props<T, M> = {
  bucket: string;
  getPrismaClientForStateCode: (stateCode: string) => T;
  filesToSchemasAndLoaderFns: FilesToSchemasAndLoaderFns<T, M>;
};
