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

import { CloudTasksClient } from "@google-cloud/tasks";
import { init } from "@sentry/node";
import { createTRPCClient, httpBatchLink, TRPCClient } from "@trpc/client";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { FastifyInstance } from "fastify/types/instance";
import fastifyAuth0Verify from "fastify-auth0-verify";
import jestExtendedMatchers from "jest-extended";
import sentryTestkit from "sentry-testkit";
import superjson from "superjson";
import { beforeAll, beforeEach, expect } from "vitest";
import { mock } from "vitest-mock-extended";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import { StateCode } from "~@meetings/prisma/client";
import { Auth0User, createContext } from "~@meetings/trpc/context";
import { AppRouter, appRouter } from "~@meetings/trpc/router";
import { fakeStaff, seed } from "~@meetings/trpc/test/setup/seed";
import { resetDb } from "~@meetings/trpc/test/setup/utils";

expect.extend(jestExtendedMatchers);

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: TRPCClient<AppRouter>;
export let testServer: FastifyInstance;
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_NE);

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

vi.mock("~@meetings/tasks", () => {
  const originalModule = vi.importActual("~@meetings/tasks");

  return {
    ...originalModule,
    getSignedUrlForNewRecording: vi.fn(
      (bucketName: string, folderName: string) => {
        return `storage.googleapis.com/${bucketName}/${folderName}/1.m4a`;
      },
    ),
  };
});

export const mockCloudTasksClient = mock<CloudTasksClient>({
  queuePath: vi.fn((project: string, location: string, queue: string) => {
    return `projects/${project}/locations/${location}/queues/${queue}`;
  }),
  createTask: vi.fn().mockResolvedValue([{ name: "task-name" }]),
});

vi.mock("@google-cloud/tasks", () => ({
  CloudTasksClient: vi.fn().mockImplementation(() => {
    return mockCloudTasksClient;
  }),
}));

export async function initFastifyAndSetUser(user: Auth0User) {
  if (testServer) {
    await testServer.close();
    // Give the port time to be fully released
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  testServer = Fastify({
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

  // Override the jwtVerify function to always pass
  testServer.addHook("preHandler", (req, reply, done) => {
    req.jwtVerify = async () => {
      return;
    };

    req.user = user;
    done();
  });

  // Start listening and wait for the server to be ready
  await testServer.listen({ port: testPort, host: testHost });
  console.log(`[ ready ] http://${testHost}:${testPort}`);

  testTRPCClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
        headers() {
          return {
            Authorization: "Bearer test-token",
            StateCode: "US_NE",
          };
        },
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
      }),
    ],
  });
}

beforeAll(async () => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
    maxValueLength: 10000,
  });
});

beforeEach(async () => {
  await resetDb(testPrismaClient);
  await seed(testPrismaClient);

  testkit.reset();

  await initFastifyAndSetUser({
    "https://dashboard.recidiviz.org/app_metadata": {
      stateCode: "US_NE",
      pseudonymizedId: fakeStaff[0].pseudonymizedId,
    },
  });
});

afterEach(async () => {
  if (testServer) {
    await testServer.close();
    // Give the port time to be fully released before the next test
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});
