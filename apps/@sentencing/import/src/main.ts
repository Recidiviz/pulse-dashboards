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

import { PSI_FILES, SAR_FILES } from "~@sentencing/import/constants";
import { getImportHandler } from "~@sentencing/import/handler";
import { StateCode } from "~@sentencing/prisma/client";

async function importData() {
  if (!process.env["STATE_CODE"]) {
    throw new Error("Missing state code environment variable");
  }

  const stateCode = process.env["STATE_CODE"] as StateCode;

  // TODO(#11931): Remove fallback logic after launch. FILES should always be set by workflow.
  // Use FILES from environment if provided, otherwise use state-specific defaults
  let files: string[];
  if (process.env["FILES"]) {
    files = process.env["FILES"].split(",");
  } else {
    // Fallback to state-specific defaults
    if (stateCode === "US_MO") {
      files = SAR_FILES;
    } else {
      // For ID, ND, and other states: use PSI files
      files = PSI_FILES;
    }
  }

  const importHandler = getImportHandler(stateCode);
  await importHandler.import(stateCode, files);
}

await importData();
