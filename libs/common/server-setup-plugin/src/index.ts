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

import cors from "@fastify/cors";
import { setupFastifyErrorHandler } from "@sentry/node";
import { AnyRouter } from "@trpc/server";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import fastifyAuth0Verify from "fastify-auth0-verify";

type BuildServerOptions<TRouter extends AnyRouter> = {
  appRouter: TRouter;
  createContext: NonNullable<
    FastifyTRPCPluginOptions<TRouter>["trpcOptions"]["createContext"]
  >;
  auth0Options: {
    domain: string;
    audience: string;
  };
};

/**
 * Returns a Fastify server with tRPC, Sentry, and Auth0 set up.
 *
 * In order for Sentry integration to work, you must initialize Sentry before starting the server.
 */
export function buildCommonServer<TRouter extends AnyRouter>(
  options: BuildServerOptions<TRouter>,
) {
  const { appRouter, createContext, auth0Options } = options;

  const server = Fastify({
    logger: true,
  });

  setupFastifyErrorHandler(server);

  server.register(fastifyTRPCPlugin, {
    prefix: "",
    trpcOptions: {
      router: appRouter,
      createContext: createContext,
      onError({ path, error }) {
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    } satisfies FastifyTRPCPluginOptions<typeof appRouter>["trpcOptions"],
  });

  server.register(fastifyAuth0Verify, {
    domain: auth0Options.domain,
    audience: auth0Options.audience,
  });

  server.register(cors, {
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  });

  return server;
}

export * from "~server-setup-plugin/trpc";
