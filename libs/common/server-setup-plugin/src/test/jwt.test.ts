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

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";
import { describe, expect, test } from "vitest";
import { beforeAll } from "vitest";

import { buildCommonServer } from "~server-setup-plugin";
import {
  Auth0AppRouter,
  createJwtContext,
  testJwtRouter,
} from "~server-setup-plugin/test/setup";

export const testPort = 3005;
export const testHost = "localhost";

export let testServer: ReturnType<typeof buildCommonServer>;

describe("jwt", () => {
  beforeAll(async () => {
    testServer = buildCommonServer({
      createContext: createJwtContext,
      appRouter: testJwtRouter,
      jwtOptions: {
        key: "0d9e4eb91b3bc1ad85a6f39c7070a6dc30c003da1eb83d86e8fdabdb4e96761f",
      },
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
  });

  afterAll(() => {
    testServer.close();
  });

  test("should be marked as unauthorized if there is no authorization header", async () => {
    // Don't pass authorization headers
    const trpcClient = createTRPCClient<Auth0AppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${testPort}`,
          // Required to get Date objects to serialize correctly.
          transformer: superjson,
        }),
      ],
    });

    await expect(() => trpcClient.test.query()).rejects.toThrowError(
      new TRPCError({
        code: "UNAUTHORIZED",
      }),
    );
  });

  test("should throw error if not authorized", async () => {
    const trpcClient = createTRPCClient<Auth0AppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${testPort}`,
          headers() {
            return {
              Authorization: "Bearer nonsense-token",
              StateCode: "US_ID",
            };
          },
          // Required to get Date objects to serialize correctly.
          transformer: superjson,
        }),
      ],
    });

    await expect(() => trpcClient.test.query()).rejects.toThrowError(
      new TRPCError({
        code: "UNAUTHORIZED",
      }),
    );
  });

  test("should be marked as authorized if passed valid token", async () => {
    const token = testServer.jwt.sign({ user: "test-user" });

    const trpcClient = createTRPCClient<Auth0AppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${testPort}`,
          headers() {
            return {
              Authorization: `Bearer ${token}`,
              StateCode: "US_ID",
            };
          },
          // Required to get Date objects to serialize correctly.
          transformer: superjson,
        }),
      ],
    });

    const result = await trpcClient.test.query();
    expect(result).toEqual("Hello, world!");
  });
});
