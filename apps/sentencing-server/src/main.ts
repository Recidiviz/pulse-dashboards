// Make sure to import the sentry module first to ensure that it is initialized before any other modules.
import "./sentry";

import { captureException } from "@sentry/node";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { fastifyAuth0Verify } from "fastify-auth0-verify";

import { createContext } from "~sentencing-server/trpc/context";
import { AppRouter, appRouter } from "~sentencing-server/trpc/router";

const host = process.env["HOST"] ?? "localhost";
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;

const server = Fastify({
  logger: true,
});

// TODO(#29653): Use new fastify error handler once Sentry v8 is released
// Send errors to Sentry
server.addHook("onError", (_request, _reply, error, done) => {
  captureException(error);
  done();
});

server.register(fastifyTRPCPlugin, {
  prefix: "",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      // report to error monitoring
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

server.register(fastifyAuth0Verify, {
  domain: import.meta.env["VITE_AUTH0_DOMAIN"],
  audience: import.meta.env["VITE_AUTH0_AUDIENCE"],
});

server.addHook("onRequest", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Start listening.
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});
