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

import { Storage } from "@google-cloud/storage";
import { CloudTasksClient, protos } from "@google-cloud/tasks";
import { captureException } from "@sentry/node";
import { OAuth2Client } from "google-auth-library";
import readline from "readline";

import { ImportRoutesHandlerBase } from "~fastify-data-import-plugin/common/classes";
import {
  EtlHelper,
  GcsObjectIdentifier,
  ObjectIdentifier,
} from "~fastify-data-import-plugin/common/types";

export type { EtlHelper, ObjectIdentifier };

/**
 * ImportRoutesHandler is a class that handles the import of data from GCS.
 *
 * Use `registerImportRoutes` to add the import routes to a Fastify server instance.
 */
export class ImportRoutesHandler extends ImportRoutesHandlerBase {
  override async verifyGoogleIdToken(
    authorizationHeaders: string | undefined,
    email: string,
  ) {
    const idToken = authorizationHeaders?.split(" ")[1];

    if (!idToken) {
      throw new Error("No bearer token was provided");
    }

    const oAuth2Client = new OAuth2Client();

    const result = await oAuth2Client.verifyIdToken({
      idToken,
    });

    const payload = result.getPayload();

    // Optionally, if "includeEmail" was set in the token options, check if the
    // email was verified
    if (!payload || !payload.email_verified || !payload.email) {
      throw new Error("Email not verified");
    }

    if (payload.email !== email) {
      throw new Error("Invalid email address");
    }

    console.log(`Email verified: ${payload.email}`);
  }

  override async *getDataFromGCS(objectIdentifier: GcsObjectIdentifier) {
    const storage = new Storage();

    const { bucketId, objectId } = objectIdentifier;

    // The files are newline-delimited JSON, so we need to split them
    const fileStream = storage
      .bucket(bucketId)
      .file(objectId)
      .createReadStream();

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        yield JSON.parse(line);
      } catch (e) {
        captureException(`Error parsing JSON ${line}: ${e}`);
        yield undefined;
      }
    }
  }

  async scheduleHandleImportCloudTask(bucketId: string, objectId: string) {
    const cloudTaskClient = new CloudTasksClient();

    const {
      cloudTaskProject,
      cloudTaskLocation,
      cloudTaskQueueName,
      cloudTaskUrl,
      cloudTaskServiceAccountEmail,
    } = this.props.triggerImportArgs;

    const parent = cloudTaskClient.queuePath(
      cloudTaskProject,
      cloudTaskLocation,
      cloudTaskQueueName,
    );

    const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
      parent: parent,
      task: {
        httpRequest: {
          headers: {
            "Content-Type": "application/json",
          },
          // @ts-expect-error Typescript doesn't know that Buffer is a valid body type
          body: Buffer.from(JSON.stringify({ bucketId, objectId })),
          httpMethod: "POST",
          url: cloudTaskUrl,
          oidcToken: {
            serviceAccountEmail: cloudTaskServiceAccountEmail,
          },
        },
      },
    };

    const [response] = await cloudTaskClient.createTask(request);

    const name = response.name;
    console.log(
      `Created task ${name} to handle import of object ${objectId} from bucket ${bucketId}`,
    );
  }
}
