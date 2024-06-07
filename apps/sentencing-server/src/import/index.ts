import { protos } from "@google-cloud/pubsub";
import { Storage } from "@google-cloud/storage";

import {
  transformAndLoadCaseData,
  transformAndLoadClientData,
  transformAndLoadStaffData,
} from "~sentencing-server/import/utils";

// https://cloud.google.com/storage/docs/pubsub-notifications
const BUCKET_ID = "bucketId";
const OBJECT_ID = "objectId";

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/case_record.py
const CASES_FILE_NAME = "sentencing_case_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/staff_record.py
const STAFF_FILE_NAME = "sentencing_staff_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/client_record.py
const CLIENTS_FILE_NAME = "sentencing_client_record.json";

export async function handleImport(encodedMessage: string) {
  const decoded = JSON.parse(Buffer.from(encodedMessage, "base64").toString());
  const message = protos.google.pubsub.v1.PubsubMessage.fromObject(decoded);

  const bucketId = message.attributes[BUCKET_ID];
  const objectId = message.attributes[OBJECT_ID];

  const storage = new Storage();
  const contents = (
    await storage.bucket(bucketId).file(objectId).download()
  ).toString();

  // The object id looks like <state_code>/<file_name>
  // For now, the state code is always Idaho, so we can ignore that
  const fileName = objectId.split("/").pop();
  const data = JSON.parse(contents);

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
