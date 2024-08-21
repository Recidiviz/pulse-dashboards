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
