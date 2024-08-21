import cors from "@fastify/cors";
import { setupFastifyErrorHandler } from "@sentry/node";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import fastifyAuth0Verify from "fastify-auth0-verify";

import { registerImportRoutes } from "~sentencing-server/server/utils";
import { createContext } from "~sentencing-server/trpc/context";
import { AppRouter, appRouter } from "~sentencing-server/trpc/router";

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

  registerImportRoutes(server);

  return server;
}
