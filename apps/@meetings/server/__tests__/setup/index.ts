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
import type { FastifyInstance } from "fastify";
import sentryTestkit from "sentry-testkit";
import superjson from "superjson";
import { beforeAll, beforeEach } from "vitest";
import { mock } from "vitest-mock-extended";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import { StateCode } from "~@meetings/prisma/client";
import { buildServer } from "~@meetings/server/server";
import { fakeStaff, seed } from "~@meetings/server/test/setup/seed";
import { resetDb } from "~@meetings/server/test/setup/utils";
import { AppRouter } from "~@meetings/trpc";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: TRPCClient<AppRouter>;
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_NE);

const { testkit, sentryTransport } = sentryTestkit();

export async function testAndGetSentryReports(expectedLength = 1) {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(expectedLength);

    return reports;
  });

  return sentryReports;
}

export let testServer: FastifyInstance;

export let getPayloadImp = vi.fn();

export function setGetPayloadImp(fn: typeof getPayloadImp) {
  getPayloadImp = fn;
}

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => {
    return {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: getPayloadImp,
      }),
    };
  }),
}));

beforeEach(() => {
  setGetPayloadImp(
    vi.fn().mockReturnValue({
      email_verified: true,
      email: "test-service-account-email@test-project.iam.gserviceaccount.com",
    }),
  );
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

beforeAll(async () => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
    maxValueLength: 10000,
  });

  testServer = buildServer();

  // Override he jwtVerify function to always pass
  testServer.addHook("preHandler", (req, reply, done) => {
    req.jwtVerify = async () => {
      return;
    };

    req.user = {
      "https://dashboard.recidiviz.org/app_metadata": {
        stateCode: "US_NE",
        pseudonymizedId: fakeStaff.pseudonymizedId,
      },
    };
    done();
  });

  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err: unknown) => {
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
