import { Storage } from "@google-cloud/storage";
import _ from "lodash";

import {
  CASES_FILE_NAME,
  CLIENTS_FILE_NAME,
  INSIGHTS_FILE_NAME,
  OPPORTUNITIES_FILE_NAME,
  STAFF_FILE_NAME,
} from "~sentencing-server/import/constants";
import {
  transformAndLoadCaseData,
  transformAndLoadClientData,
  transformAndLoadInsightData,
  transformAndLoadOpportunityData,
  transformAndLoadStaffData,
} from "~sentencing-server/import/utils";

export async function handleImport(bucketId: string, objectId: string) {
  const storage = new Storage();

  // The files are newline-delimited JSON, so we need to split them
  const contents = (await storage.bucket(bucketId).file(objectId).download())
    .toString()
    .split("\n");

  // The object id looks like <state_code>/<file_name>
  // For now, the state code is always Idaho, so we can ignore that
  const fileName = objectId.split("/").pop();
  const data = _.map(contents, (row) => {
    try {
      return JSON.parse(row);
    } catch (e) {
      console.error(`Error parsing JSON ${row}: ${e}`);
      return undefined;
    }
  }).filter((row) => row !== undefined);

  if (fileName === CASES_FILE_NAME) {
    await transformAndLoadCaseData(data);
  } else if (fileName === STAFF_FILE_NAME) {
    await transformAndLoadStaffData(data);
  } else if (fileName === CLIENTS_FILE_NAME) {
    await transformAndLoadClientData(data);
  } else if (fileName === OPPORTUNITIES_FILE_NAME) {
    await transformAndLoadOpportunityData(data);
  } else if (fileName === INSIGHTS_FILE_NAME) {
    await transformAndLoadInsightData(data);
  } else {
    throw Error(`Unknown file name: ${fileName}`);
  }
}
