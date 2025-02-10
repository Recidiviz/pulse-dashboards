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

import fs from "node:fs";

import _ from "lodash";
import { z } from "zod";

import {
  caseImportSchema,
  clientImportSchema,
  countyAndDistrictImportSchema,
  insightImportSchema,
  offenseImportSchema,
  opportunityImportSchema,
  staffImportSchema,
} from "~sentencing-server/import/handle-import/models";

const zodSchemaMap: Record<string, z.ZodTypeAny> = {
  case: z.array(caseImportSchema),
  client: z.array(clientImportSchema),
  insight: z.array(insightImportSchema),
  offense: z.array(offenseImportSchema),
  opportunity: z.array(opportunityImportSchema),
  staff: z.array(staffImportSchema),
  countyAndDistrict: z.array(countyAndDistrictImportSchema),
};

function getData(fileName: string) {
  const fileData = fs.readFileSync(fileName, "utf8");

  // The files are newline-delimited JSON, so we need to split them
  const contents = fileData.split("\n");
  return _.map(contents, (row) => {
    try {
      return JSON.parse(row);
    } catch (e) {
      return undefined;
    }
  }).filter((row) => row !== undefined);
}

function main() {
  const fileName = process.argv[2];
  const zodSchemaName = process.argv[3];

  const schema = zodSchemaMap[zodSchemaName];
  const data = getData(fileName);

  schema.parse(data);
}

main();
