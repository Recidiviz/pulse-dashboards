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

import { StateCode, stateCodes } from "~@jii/configs";
import { getPrismaClientForStateCode } from "~@jii/prisma";
import { ImportHandler } from "~data-import-plugin";

import { FILE_NAME_TO_SCHEMA_AND_LOADER_FN } from "./constants";

class JiiImportHandler<T, M> extends ImportHandler<T, M> {
  override shouldImportFile(file: string, stateCode: string): boolean {
    const shouldImport = super.shouldImportFile(file, stateCode);

    // defer to rejections by the default method
    if (!shouldImport) return false;

    // add extra checks for state-specific imports, based on naming convention (name starts with state code)
    const possibleStateCodePrefix = file.substring(0, 5).toUpperCase();
    if (stateCodes.options.includes(possibleStateCodePrefix as StateCode)) {
      // if prefix is a state code, only proceed if prefix matches the current state;
      // we don't expect these files to be exported for other states
      // (and even if they were, they'd be empty and useless)
      return stateCode === possibleStateCodePrefix;
    }

    return true;
  }
}

export function getImportHandler() {
  if (!process.env["IMPORT_BUCKET_ID"]) {
    throw new Error("Missing import bucket id environment variable");
  }

  const bucket = process.env["IMPORT_BUCKET_ID"];

  return new JiiImportHandler({
    bucket,
    getPrismaClientForStateCode,
    filesToSchemasAndLoaderFns: FILE_NAME_TO_SCHEMA_AND_LOADER_FN,
  });
}
