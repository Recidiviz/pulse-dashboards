import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/node";
import _ from "lodash";

import { getFileType } from "~sentencing-server/import/common/utils";
import { FILE_TYPE_TO_ETL_HELPER } from "~sentencing-server/import/handle-import/constants";

export async function handleImport(bucketId: string, objectId: string) {
  const storage = new Storage();

  const fileType = getFileType(objectId);

  const etlHelper = FILE_TYPE_TO_ETL_HELPER[fileType];

  // The files are newline-delimited JSON, so we need to split them
  const contents = (await storage.bucket(bucketId).file(objectId).download())
    .toString()
    .split("\n");
  const data = _.map(contents, (row) => {
    try {
      return JSON.parse(row);
    } catch (e) {
      captureException(`Error parsing JSON ${row}: ${e}`);
      return undefined;
    }
  }).filter((row) => row !== undefined);

  await etlHelper(data);
}
