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

import { init } from "@sentry/node";
import { createTRPCClient, httpBatchLink, TRPCClient } from "@trpc/client";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { FastifyInstance } from "fastify/types/instance";
import fastifyAuth0Verify from "fastify-auth0-verify";
import sentryTestkit from "sentry-testkit";
import superjson from "superjson";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import { getPrismaClientForStateCode } from "~@sentencing/prisma";
import { StateCode } from "~@sentencing/prisma/client";
import { createContext } from "~@sentencing/trpc/context";
import { AppRouter, appRouter } from "~@sentencing/trpc/router";
import { mswServer } from "~@sentencing/trpc/test/setup/msw";
import { seed } from "~@sentencing/trpc/test/setup/seed";
import { resetDb } from "~@sentencing/trpc/test/setup/utils";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: TRPCClient<AppRouter>;
export let testServer: FastifyInstance;
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

beforeAll(async () => {
  mswServer.listen();

  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
    maxValueLength: 10000,
  });

  const testServer = Fastify({
    logger: true,
  });

  testServer.register(fastifyTRPCPlugin, {
    prefix: "",
    trpcOptions: {
      router: appRouter,
      createContext: createContext,
      onError({ path, error }) {
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    } satisfies FastifyTRPCPluginOptions<typeof appRouter>["trpcOptions"],
  });

  testServer.register(fastifyAuth0Verify, {
    domain: "domain",
    audience: "audience",
  });

  // Override he jwtVerify function to always pass
  testServer.addHook("preHandler", (req, reply, done) => {
    req.jwtVerify = vi.fn(async () => {
      return "";
    });
    done();
  });

  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}`);
    }
  });

  testTRPCClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
        headers() {
          return {
            Authorization: "Bearer test-token",
            StateCode: "US_ID",
          };
        },
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
      }),
    ],
  });
});

beforeEach(async () => {
  await resetDb(testPrismaClient);
  await seed(testPrismaClient);

  testkit.reset();
});

afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
