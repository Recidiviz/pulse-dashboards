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

interface ZodSchemaAndLoaderFn<T, U extends z.ZodTypeAny> {
  schema: U;
  loaderFn: (
    prismaClient: T,
    data: AsyncGenerator<z.infer<U>>,
  ) => Promise<void>;
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
