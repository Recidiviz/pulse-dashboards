// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import type {
  GetRowId,
  LoaderContext,
  Props,
} from "~data-import-plugin/common/types";

/**
 * Base class for handling imports from GCS.
 */
export abstract class ImportHandlerBase<T, M> {
  props;

  /**
   * @param props - The properties for the ImportHandlerBase. See the Props type for more information.
   */
  constructor(props: Props<T, M>) {
    this.props = props;
  }

  /**
   * Returns the data from GCS for the provided bucket and file combination as an iterable AsyncGenerator.
   */
  abstract getDataFromGCS(
    bucket: string,
    file: string,
  ): AsyncGenerator<unknown>;

  // base implementation does not use stateCode but subclasses may need it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldImportFile(file: string, stateCode: string): boolean {
    const { filesToSchemasAndLoaderFns } = this.props;

    if (!(file in filesToSchemasAndLoaderFns)) {
      console.warn(`No loader function found for file ${file}. Skipping.`);
      return false;
    }

    return true;
  }

  /**
   * Retrieves and transforms data from GCS using the provided schema.
   */
  private async *getAndTransformDataFromGCS<K extends z.ZodTypeAny>(
    bucket: string,
    file: string,
    schema: K,
    lineErrorList: string[],
    loaderContext: LoaderContext,
    getRowId?: GetRowId,
  ) {
    const data = this.getDataFromGCS(bucket, file);
    let lineNumber = 0;
    for await (const datum of data) {
      lineNumber++;
      try {
        yield schema.parse(datum) as z.infer<K>;
      } catch (e) {
        // Instead of throwing an error immediately, we log the error and continue processing the next record.
        // Where the file gives us a way to identify the row, we also record its id, so that the
        // loader can decide what to do about the record this row would have updated.
        let rowDescription = "";
        if (getRowId) {
          let rowId: string | undefined;

          // don't let an error in getRowId itself blow up the entire import
          try {
            rowId = getRowId(datum);
          } catch {
            rowId = undefined;
          }

          if (rowId === undefined) {
            loaderContext.unidentifiedSkippedRowCount++;
            rowDescription = " (row id could not be determined)";
          } else {
            loaderContext.skippedRowIds.add(rowId);
            rowDescription = ` (row id ${rowId})`;
          }
        }

        lineErrorList.push(
          `Unable to parse data for line ${lineNumber}${rowDescription}. Error: ${e}`,
        );
      }

      if (lineNumber % 100 === 0) {
        console.log(`Processed ${lineNumber} records from ${file}...`);
      }
    }
    console.log(`Processed ${lineNumber} records from ${file}.`);
  }

  /**
   * Imports data from GCS for the provided state code.
   *
   * @param stateCode - The state code to import data for.
   * @param files - The files to import. If not provided, all files will be imported.
   */
  public async import(stateCode: string, files?: string[]) {
    const { bucket, getPrismaClientForStateCode, filesToSchemasAndLoaderFns } =
      this.props;

    console.log(
      `Received notification for import of data from bucket id ${bucket} for state code ${stateCode}.`,
    );
    console.log(`Files to import: ${files ? files.join(", ") : "all files"}.`);

    let prismaClient;
    try {
      prismaClient = getPrismaClientForStateCode(stateCode);
    } catch (e) {
      throw new Error(`Unsupported state code: ${stateCode}. Error: ${e}`);
    }

    const errors = [];

    for await (const file of files ?? Object.keys(filesToSchemasAndLoaderFns)) {
      console.log(`Loading data for file ${file}.`);

      const lineErrorList: string[] = [];

      // initialize a fresh loader context for this file.
      // it will be populated as the `getAndTransformDataFromGCS` generator is consumed by `loaderFn`,
      // which is why it needs to be managed here and passed to both functions
      const loaderContext: LoaderContext = {
        skippedRowIds: new Set(),
        unidentifiedSkippedRowCount: 0,
      };
      try {
        if (!this.shouldImportFile(file, stateCode)) {
          continue;
        }

        const { schema, loaderFn, getRowId } = filesToSchemasAndLoaderFns[file];

        const data = this.getAndTransformDataFromGCS(
          bucket,
          `${stateCode}/${file}`,
          schema,
          lineErrorList,
          loaderContext,
          getRowId,
        );

        await loaderFn(prismaClient, data, loaderContext);
      } catch (e) {
        // Handle any unexpected errors that occur during the import process.
        let message = e;
        if (e instanceof Error) {
          message = e.message;
        }

        // If a file errors for any reason, we want to continue importing the other files; therefore we note the error but continue.
        errors.push(
          `Unexpected error importing ${file} from bucket id ${bucket} for state code ${stateCode}: ${message}`,
        );
        continue;
      }

      // Add any errors that occurred during the parsing of individual records.
      if (lineErrorList.length > 0) {
        errors.push(
          `Error individual lines from ${file} from bucket id ${bucket} for state code ${stateCode}:\n${lineErrorList.join("\n")}`,
        );
      }

      console.log(
        `Successfully imported ${file} from bucket id ${bucket} for state code ${stateCode}.`,
      );
    }

    // @ts-expect-error the type in the import helper class is a generic, since the PrismaClient is dependent on the product
    await prismaClient.$disconnect();

    // If there were any errors, throw an error with all of the error messages.
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  }
}
