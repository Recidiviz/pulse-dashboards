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

import { FILE_NAME_TO_SCHEMA_AND_LOADER_FN } from "~@sentencing-server/import/constants";
import { getPrismaClientForStateCode } from "~@sentencing-server/prisma";
import { ImportHandler } from "~data-import-plugin";

export function getImportHandler() {
  if (!process.env["IMPORT_BUCKET_ID"]) {
    throw new Error("Missing import bucket id environment variable");
  }

  return new ImportHandler({
    bucket: process.env["IMPORT_BUCKET_ID"],
    getPrismaClientForStateCode: getPrismaClientForStateCode,
    filesToSchemasAndLoaderFns: FILE_NAME_TO_SCHEMA_AND_LOADER_FN,
  });
}
