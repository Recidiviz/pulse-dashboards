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

import { StateCode } from "@prisma/jii-texting-server/client";
import { captureException } from "@sentry/node";
import { FastifyInstance } from "fastify";

import { getPrismaClientForStateCode } from "~@jii-texting-server/prisma";
import {
  ImportRoutesHandler,
  ObjectIdentifier,
} from "~fastify-data-import-plugin";
import { FILE_NAME_TO_ETL_HELPER } from "~jii-texting-server/server/constants";

export function etlHelperGetter(identifier: ObjectIdentifier) {
  const { stateCode, fileName, bucketId } = identifier;

  if (!(bucketId === process.env["IMPORT_BUCKET_ID"])) {
    return undefined;
  }

  try {
    getPrismaClientForStateCode(stateCode);
  } catch {
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

export function isValidStateCode(stateCode: string) {
  return (Object.values(StateCode) as string[]).includes(stateCode);
}
