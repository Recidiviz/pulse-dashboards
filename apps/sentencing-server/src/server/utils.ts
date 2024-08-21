import { captureException } from "@sentry/node";
import { FastifyInstance } from "fastify";

import {
  ImportRoutesHandler,
  ObjectIdentifier,
} from "~fastify-data-import-plugin";
import {
  FILE_NAME_TO_ETL_HELPER,
  SUPPORTED_STATE_CODES,
} from "~sentencing-server/server/constants";

export function etlHelperGetter(identifier: ObjectIdentifier) {
  const { objectId, bucketId } = identifier;

  if (!(bucketId === process.env["IMPORT_BUCKET_ID"])) {
    return undefined;
  }

  const [stateCode, fileName] = objectId.split("/");

  if (!SUPPORTED_STATE_CODES.includes(stateCode)) {
    return undefined;
  }

  return FILE_NAME_TO_ETL_HELPER[fileName];
}

export function registerImportRoutes(server: FastifyInstance) {
  if (
    !process.env["IMPORT_BUCKET_ID"] ||
    !process.env["CLOUD_STORAGE_NOTIFICATION_IAM_EMAIL"] ||
    !process.env["IMPORT_CLOUD_TASK_PROJECT"] ||
    !process.env["IMPORT_CLOUD_TASK_LOCATION"] ||
    !process.env["IMPORT_CLOUD_TASK_QUEUE"] ||
    !process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"] ||
    !process.env["IMPORT_CLOUD_TASK_URL"]
  ) {
    throw new Error(
      "Missing required environment variables for import routes setup",
    );
  }

  const importHandler = new ImportRoutesHandler({
    etlHelperGetter,
    triggerImportArgs: {
      iamEmail: process.env["CLOUD_STORAGE_NOTIFICATION_IAM_EMAIL"],
      cloudTaskProject: process.env["IMPORT_CLOUD_TASK_PROJECT"],
      cloudTaskLocation: process.env["IMPORT_CLOUD_TASK_LOCATION"],
      cloudTaskQueueName: process.env["IMPORT_CLOUD_TASK_QUEUE"],
      cloudTaskServiceAccountEmail:
        process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"],
      cloudTaskUrl: process.env["IMPORT_CLOUD_TASK_URL"],
    },
    handleImportArgs: {
      iamEmail: process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"],
    },
    exceptionHandler: captureException,
  });

  importHandler.registerImportRoutes(server);
}
