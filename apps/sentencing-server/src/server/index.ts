import cors from "@fastify/cors";
import { captureException, setupFastifyErrorHandler } from "@sentry/node";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import type { FastifyRequest } from "fastify";
import Fastify from "fastify";
import fastifyAuth0Verify from "fastify-auth0-verify";

import { getFileType } from "~sentencing-server/import/common/utils";
import { handleImport } from "~sentencing-server/import/handle-import";
import { scheduleHandleImportCloudTask } from "~sentencing-server/import/trigger-import";
import { verifyGoogleIdToken } from "~sentencing-server/server/utils";
import { createContext } from "~sentencing-server/trpc/context";
import { AppRouter, appRouter } from "~sentencing-server/trpc/router";

interface PubsubBodyType {
  message?: {
    attributes: {
      bucketId: string;
      objectId: string;
    };
  };
}

interface TaskBodyType {
  bucketId: string;
  objectId: string;
}

export function buildServer() {
  const server = Fastify({
    logger: true,
  });

  setupFastifyErrorHandler(server);

  server.register(fastifyTRPCPlugin, {
    prefix: "",
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }) {
        // TODO(https://github.com/Recidiviz/recidiviz-data/issues/30480): report errors correctly to Sentry
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  server.register(fastifyAuth0Verify, {
    domain: process.env["AUTH0_DOMAIN"],
    audience: process.env["AUTH0_AUDIENCE"],
  });

  server.register(cors, {
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  });

  /**
   * Handles Pub/Sub messages that trigger an import of a file from GCS.
   *
   * While we log the errors with Sentry, we always return a response of
   * 200 when there is an internal error, otherwise Pub/Sub will retry
   * the message repeatedly.
   */
  server.post(
    "/trigger_import",
    async (req: FastifyRequest<{ Body: PubsubBodyType }>, res) => {
      const bearerToken = req.headers.authorization?.split(" ")[1];

      if (!bearerToken) {
        captureException("No bearer token was provided");
        return;
      }

      if (!process.env["CLOUD_STORAGE_NOTIFICATION_IAM_EMAIL"]) {
        captureException("No IAM email env variable was provided");
        return;
      }

      try {
        await verifyGoogleIdToken(
          bearerToken,
          process.env["CLOUD_STORAGE_NOTIFICATION_IAM_EMAIL"],
        );
      } catch (e) {
        captureException(`error verifying auth token: ${e}`);
        return;
      }

      if (
        !req.body.message?.attributes ||
        !req.body.message.attributes.bucketId ||
        !req.body.message.attributes.objectId
      ) {
        captureException(`invalid Pub/Sub message format`);
        return;
      }

      const { bucketId, objectId } = req.body.message.attributes;

      // Make sure the file type is valid before proceeding
      try {
        getFileType(objectId);
      } catch (e) {
        captureException(e);
        return;
      }

      console.log(
        `Received valid notification for the update of object ${objectId} from bucket ${bucketId}. Scheduling import task.`,
      );

      try {
        await scheduleHandleImportCloudTask(bucketId, objectId);
      } catch (e) {
        captureException(`error scheduling import task: ${e}`);
        return;
      }

      res.status(200).send("File update acknowledged and import is scheduled.");
    },
  );

  /**
   * Handles the import of data from a file from GCS.
   */
  server.post(
    "/handle_import",
    async (req: FastifyRequest<{ Body: TaskBodyType }>, res) => {
      const bearerToken = req.headers.authorization?.split(" ")[1];

      if (!bearerToken) {
        res.status(401);
        throw new Error("No bearer token was provided");
      }

      if (!process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"]) {
        res.status(500);
        throw new Error("No IAM email env variable was provided");
      }

      try {
        await verifyGoogleIdToken(
          bearerToken,
          process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"],
        );
      } catch (e) {
        res.status(401);
        throw new Error(`error verifying auth token for handle_import: ${e}`);
      }

      const { bucketId, objectId } = req.body;
      console.log(
        `Received notification for import of object ${objectId} from bucket ${bucketId}`,
      );

      try {
        getFileType(objectId);
      } catch (e) {
        res.status(401);
        throw new Error(`Invalid object ID: ${e}`);
      }

      try {
        await handleImport(bucketId, objectId);
      } catch (e) {
        res.status(500);

        throw new Error(
          `Error importing object ${objectId} from bucket ${bucketId}: ${e}`,
        );
      }

      console.log(
        `Import of object ${objectId} from bucket ${bucketId} completed.`,
      );

      res
        .status(200)
        .send(
          `Import of object ${objectId} from bucket ${bucketId} completed.`,
        );
    },
  );

  return server;
}
