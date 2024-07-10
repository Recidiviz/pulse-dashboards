import { Storage } from "@google-cloud/storage";
import _ from "lodash";

import {
  transformAndLoadCaseData,
  transformAndLoadClientData,
  transformAndLoadStaffData,
} from "~sentencing-server/import/utils";

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/case_record.py
const CASES_FILE_NAME = "sentencing_case_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/staff_record.py
const STAFF_FILE_NAME = "sentencing_staff_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/client_record.py
const CLIENTS_FILE_NAME = "sentencing_client_record.json";

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
  } else {
    throw Error(`Unknown file name: ${fileName}`);
  }
}
