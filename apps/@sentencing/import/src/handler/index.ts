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

import {
    FILE_NAME_TO_SCHEMA_AND_LOADER_FN,
    SAR_FILE_NAME_TO_SCHEMA_AND_LOADER_FN,
} from "~@sentencing/import/constants";
import { getPrismaClientForStateCode } from "~@sentencing/prisma";
import { StateCode } from "~@sentencing/prisma/client";
import { ImportHandler } from "~data-import-plugin";

/**
 * Report types supported by the sentencing import pipeline.
 * - PSI: Pre-Sentence Investigation (used by ID, ND)
 * - SAR: Sentencing Assessment Report (used by MO)
 */
type ReportType = "PSI" | "SAR";

/**
 * Maps state codes to their report type.
 */
const STATE_TO_REPORT_TYPE: Record<StateCode, ReportType> = {
  [StateCode.US_ID]: "PSI",
  [StateCode.US_MO]: "SAR",
  [StateCode.US_ND]: "PSI",
} as Record<StateCode, ReportType>;

/**
 * Returns the appropriate file-to-schema mapping based on state code.
 * Uses STATE_TO_REPORT_TYPE to determine which loaders to use.
 */
export function getFilesToSchemasAndLoaderFns(stateCode: StateCode) {
  const reportType = STATE_TO_REPORT_TYPE[stateCode];

  if (reportType === "SAR") {
    return SAR_FILE_NAME_TO_SCHEMA_AND_LOADER_FN;
  }
  return FILE_NAME_TO_SCHEMA_AND_LOADER_FN;
}

export function getImportHandler(stateCode?: StateCode) {
  if (!process.env["IMPORT_BUCKET_ID"]) {
    throw new Error("Missing import bucket id environment variable");
  }

  const bucket = process.env["IMPORT_BUCKET_ID"];

  if (stateCode && STATE_TO_REPORT_TYPE[stateCode] === "SAR") {
    return new ImportHandler({
      bucket,
      getPrismaClientForStateCode,
      filesToSchemasAndLoaderFns: SAR_FILE_NAME_TO_SCHEMA_AND_LOADER_FN,
    });
  }

  return new ImportHandler({
    bucket,
    getPrismaClientForStateCode,
    filesToSchemasAndLoaderFns: FILE_NAME_TO_SCHEMA_AND_LOADER_FN,
  });
}
