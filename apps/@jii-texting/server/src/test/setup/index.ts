// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { StateCode } from "@prisma/jii-texting/client";
import { init } from "@sentry/node";
import { OAuth2Client } from "google-auth-library";
import sentryTestkit from "sentry-testkit";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import { buildServer } from "~@jii-texting/server/server";
import { seed } from "~@jii-texting/server/test/setup/seed";
import { resetDb } from "~@jii-texting/server/test/setup/utils";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testServer: ReturnType<typeof buildServer>;
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);
export let mockVerifyIdToken: ReturnType<typeof vi.fn>;
export let mockGetPayload: ReturnType<typeof vi.fn>;
export let mockTwilioVaildateRequest: ReturnType<typeof vi.fn>;

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

vi.mock("twilio/lib/webhooks/webhooks", () => ({
  validateRequest: vi.fn(),
}));

export const mockInsertFn = vi.fn();
export const mockTableFn = vi.fn().mockImplementation(() => {
  return {
    insert: mockInsertFn,
  };
});
export const mockDatasetFn = vi.fn().mockImplementation(() => {
  return {
    table: mockTableFn,
  };
});

vi.mock("@google-cloud/bigquery", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@google-cloud/bigquery")>();
  return {
    ...actual,
    BigQuery: vi.fn().mockImplementation(() => {
      return {
        dataset: mockDatasetFn,
      };
    }),
  };
});

beforeAll(async () => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
  });

  testServer = buildServer();

  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}`);
    }
  });
});

beforeEach(async () => {
  testkit.reset();

  await resetDb(testPrismaClient);
  await seed(testPrismaClient);

  // Get the mocked verifyIdToken function from OAuth2Client
  mockVerifyIdToken = vi.fn(async () => ({
    getPayload: mockGetPayload,
  }));

  mockGetPayload = vi.fn();
  // Ensure `verifyIdToken` returns an object with a `getPayload()` function
  vi.spyOn(OAuth2Client.prototype, "verifyIdToken").mockImplementation(
    mockVerifyIdToken,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await testServer.close();
});
