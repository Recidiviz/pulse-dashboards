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

import { getImportHandler } from "~@sentencing-server/import/handler";

async function importData() {
  if (!process.env["STATE_CODE"]) {
    throw new Error("Missing state code environment variable");
  }

  const files = process.env["FILES"]?.split(",");

  const importHandler = getImportHandler();

  await importHandler.import(process.env["STATE_CODE"], files);
}

await importData();
