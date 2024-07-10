// Make sure to import the sentry module first to ensure that it is initialized before any other modules.
import "~sentencing-server/sentry";

import cors from "@fastify/cors";
import { setupFastifyErrorHandler } from "@sentry/node";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import type { FastifyRequest } from "fastify";
import Fastify from "fastify";
import fastifyAuth0Verify from "fastify-auth0-verify";

import { handleImport } from "~sentencing-server/import";
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
    domain: import.meta.env["VITE_AUTH0_DOMAIN"],
    audience: import.meta.env["VITE_AUTH0_AUDIENCE"],
  });

  server.register(cors, {
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  });

  server.post(
    "/trigger_import",
    async (req: FastifyRequest<{ Body: PubsubBodyType }>, res) => {
      if (
        !req.body.message?.attributes ||
        !req.body.message.attributes.bucketId ||
        !req.body.message.attributes.objectId
      ) {
        const msg = "invalid Pub/Sub message format";
        console.error(`error: ${msg}`);
        res.status(400).send(`Bad Request: ${msg}`);
        return;
      }

      // TODO(https://github.com/Recidiviz/recidiviz-data/issues/30480): report errors correctly to Sentry
      const { bucketId, objectId } = req.body.message.attributes;
      await handleImport(bucketId, objectId);

      res.status(200).send("Import complete");
    },
  );

  return server;
}
