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

import { request } from "node:http";

import { File } from "@google-cloud/storage";
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
import { GenericContainer } from "testcontainers";
import { beforeAll, beforeEach } from "vitest";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import { StateCode } from "~@meetings/prisma/client";
import { createContext } from "~@meetings/trpc/context";
import { AppRouter, appRouter } from "~@meetings/trpc/router";
import { fakeStaff, seed } from "~@meetings/trpc/test/setup/seed";
import { resetDb } from "~@meetings/trpc/test/setup/utils";
export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: TRPCClient<AppRouter>;
export let testServer: FastifyInstance;
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_NE);

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

const FAKE_GCS_PORT = 4443;

const gcsContainer = await new GenericContainer("fsouza/fake-gcs-server:1.52.3")
  .withEntrypoint([
    "/bin/fake-gcs-server",
    "-scheme",
    "http",
    "-public-host",
    "localhost:4443",
  ])
  .withExposedPorts(FAKE_GCS_PORT)
  .start();

export const GCS_API_ENDPOINT = `http://${gcsContainer.getHost()}:${gcsContainer.getMappedPort(FAKE_GCS_PORT)}`;

const data = JSON.stringify({ externalUrl: GCS_API_ENDPOINT });

// This updates the external url of the fake-gcs-server so that uploads work
const options = {
  hostname: new URL(GCS_API_ENDPOINT).hostname,
  port: new URL(GCS_API_ENDPOINT).port,
  path: `${new URL(GCS_API_ENDPOINT).pathname}/_internal/config`,
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = request(options);
req.write(data);
req.end();

// Mock out the Storage constructor to use our fake-gcs-server endpoint
vi.mock("@google-cloud/storage", async (importOriginal) => {
  const mod: typeof import("@google-cloud/storage") = await importOriginal();
  return {
    ...mod,
    Storage: vi.fn(
      () =>
        new mod.Storage({ apiEndpoint: GCS_API_ENDPOINT, projectId: "test" }),
    ),
  };
});

// Mock the getSignedUrl method to return a predictable URL
vi.spyOn(File.prototype, "getSignedUrl").mockImplementation(async function (
  this: File,
) {
  return [`${GCS_API_ENDPOINT}/${this.name}`];
});

beforeAll(async () => {
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
    req.jwtVerify = async () => {
      return;
    };

    req.user = {
      "https://dashboard.recidiviz.org/app_metadata": {
        pseudonymizedId: fakeStaff.pseudonymizedId,
      },
    };
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
            StateCode: "US_NE",
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
