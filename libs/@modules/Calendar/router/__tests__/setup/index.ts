// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  createTRPCClient,
  httpBatchLink,
  TRPCClient,
  TRPCLink,
} from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import type { FastifyInstance } from "fastify";
import superjson from "superjson";

import { getPrismaClient } from "~@modules/Calendar/prisma";
import {
  type Auth0User,
  createContext,
  router,
} from "~@modules-server/trpc-base";
import { buildCommonServer } from "~server-setup-plugin";

import { insertFixtures } from "./fixtures";
import { resetCalendarTables } from "./resetCalendarTables";

/**
 * The HTTP harness for the calendar procedures. It builds its own server
 * around the router a test passes instead of importing the Modules app
 * router, which imports this library. Start the test database first; see the
 * README.
 */

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3005;
export const testHost = process.env["HOST"] ?? "localhost";
export const testPrismaClient = getPrismaClient("US_CO");

let testServer: FastifyInstance | undefined;

/** The type of a router from the Modules tRPC instance, for the shared link. */
type ModulesRouter = ReturnType<typeof router>;

async function stopServer() {
  if (testServer) {
    await testServer.close();
    testServer = undefined;
  }
}

export interface HarnessOptions<TRouter extends AnyRouter> {
  /** Send no Authorization header. */
  omitAuth?: boolean;
  /** The StateCode header. Defaults to "US_CO". */
  stateCode?: string;
  /** Send no StateCode header. */
  omitStateCode?: boolean;
  extraHeaders?: Record<string, string>;
  /** The router to mount. */
  router: TRouter;
}

/**
 * Starts the server with jwtVerify stubbed so req.user is the given token,
 * and returns a client for the mounted router.
 */
export async function initFastifyAndSetUser<TRouter extends AnyRouter>(
  user: Auth0User | undefined,
  options: HarnessOptions<TRouter>,
): Promise<TRPCClient<TRouter>> {
  await stopServer();

  const server = buildCommonServer({
    appRouter: options.router,
    createContext,
    auth0Options: { domain: "test-domain", audience: "test-audience" },
  });
  server.addHook("preHandler", (req, _reply, done) => {
    req.jwtVerify = async () => undefined;
    if (user) req.user = user;
    done();
  });
  await server.listen({ port: testPort, host: testHost });
  testServer = server;

  const link = httpBatchLink<ModulesRouter>({
    url: `http://${testHost}:${testPort}`,
    headers() {
      const headers: Record<string, string> = {};
      if (!options.omitStateCode) {
        headers["StateCode"] = options.stateCode ?? "US_CO";
      }
      if (!options.omitAuth) {
        headers["Authorization"] = "Bearer test-token";
      }
      return { ...headers, ...options.extraHeaders };
    },
    // Required to get Date objects to serialize correctly.
    transformer: superjson,
  });
  // Every router here comes from the Modules tRPC instance, so the link built
  // for its empty router fits the mounted one too; TypeScript can't see that
  // through the generic.
  return createTRPCClient<TRouter>({
    links: [link as unknown as TRPCLink<TRouter>],
  });
}

beforeEach(async () => {
  await resetCalendarTables(testPrismaClient);
  await insertFixtures(testPrismaClient);
});

afterEach(async () => {
  await stopServer();
});

afterAll(async () => {
  await testPrismaClient.$disconnect();
});
