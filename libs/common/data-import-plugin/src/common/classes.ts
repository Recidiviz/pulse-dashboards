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

import type { PrismaClient, Props } from "~data-import-plugin/common/types";

/**
 * Base class for handling imports from GCS.
 */
export abstract class ImportHandlerBase<T extends PrismaClient, M> {
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

  /**
   * Retrieves and transforms data from GCS using the provided schema.
   */
  private async *getAndTransformDataFromGCS<K extends z.ZodTypeAny>(
    bucket: string,
    file: string,
    schema: K,
  ) {
    const data = this.getDataFromGCS(bucket, file);
    for await (const datum of data) {
      try {
        yield schema.parse(datum) as z.infer<K>;
      } catch (e) {
        throw new Error(
          `\nUnable to parse data:\nData: ${JSON.stringify(datum, null, 2)}\nError: ${e}`,
        );
      }
    }
  }

  /**
   * Imports data from GCS for the provided state code.
   */
  public async import(stateCode: string) {
    const {
      bucket,
      getPrismaClientForStateCode,
      filesToSchemasAndLoaderFns: filesToModelsAndLoaderFns,
    } = this.props;

    console.log(
      `Received notification for import of data from bucket id ${bucket} for state code ${stateCode}.`,
    );

    let prismaClient;
    try {
      prismaClient = getPrismaClientForStateCode(stateCode);
    } catch {
      throw new Error(`Unsupported state code: ${stateCode}`);
    }

    const errors = [];
    for await (const file of Object.keys(filesToModelsAndLoaderFns)) {
      console.log(`Loading data for file ${file}.`);

      try {
        const { schema, loaderFn } = filesToModelsAndLoaderFns[file];
        const data = this.getAndTransformDataFromGCS(
          bucket,
          `${stateCode}/${file}`,
          schema,
        );

        await loaderFn(prismaClient, data);
      } catch (e) {
        let message = e;
        if (e instanceof Error) {
          message = e.message;
        }

        // If a file errors for any reason, we want to continue importing the other files; therefore we note the error but continue.
        errors.push(
          `Error importing ${file} from bucket id ${bucket} for state code ${stateCode}: ${message}`,
        );
        continue;
      }

      console.log(
        `Successfully imported ${file} from bucket id ${bucket} for state code ${stateCode}.`,
      );
    }

    // If there were any errors, throw an error with all of the error messages.
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  }
}
