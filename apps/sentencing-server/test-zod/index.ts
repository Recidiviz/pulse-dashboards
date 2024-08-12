import fs from "node:fs";

import _ from "lodash";
import { z } from "zod";

import {
  caseImportSchema,
  clientImportSchema,
  insightImportSchema,
  offenseImportSchema,
  opportunityImportSchema,
  staffImportSchema,
} from "~sentencing-server/import/handle-import/models";

const zodSchemaMap: Record<string, z.ZodTypeAny> = {
  case: caseImportSchema,
  client: clientImportSchema,
  insight: insightImportSchema,
  offense: offenseImportSchema,
  opportunity: opportunityImportSchema,
  staff: staffImportSchema,
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
