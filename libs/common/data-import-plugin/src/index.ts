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

import { Storage } from "@google-cloud/storage";
import readline from "readline";

import { ImportHandlerBase } from "~data-import-plugin/common/classes";

/**
 * ImportHandler is a class that handles the import of data from GCS.
 */
export class ImportHandler<T, M> extends ImportHandlerBase<T, M> {
  override async *getDataFromGCS(bucket: string, file: string) {
    const storage = new Storage();

    // The files are newline-delimited JSON, so we need to split them
    const fileStream = storage.bucket(bucket).file(file).createReadStream();

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        yield JSON.parse(line);
      } catch (e) {
        throw new Error(`Error parsing JSON ${line}: ${e}`);
      }
    }
  }
}
