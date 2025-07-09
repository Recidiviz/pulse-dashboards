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

import { buildCommonServer } from "~server-setup-plugin";
import { testHost, testPort } from "~server-setup-plugin/test/setup";
import {
  AppRouter,
  createContext,
  testRouter,
} from "~server-setup-plugin/test/setup/trpc";

describe("init trpc", () => {
  describe("auth", () => {
    test("should be marked as unauthorized if there is no authorization header", async () => {
      // Don't pass authorization headers
      const customTestTRPCClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${testPort}`,
            // Required to get Date objects to serialize correctly.
            transformer: superjson,
          }),
        ],
      });

      await expect(() =>
        customTestTRPCClient.test.query(),
      ).rejects.toThrowError(
        new TRPCError({
          code: "UNAUTHORIZED",
        }),
      );
    });

    test("should throw error if not authorized", async () => {
      // Create a new server for this test that fails on auth
      const customTestServer = buildCommonServer({
        createContext,
        appRouter: testRouter,
        auth0Options: {
          domain: "test",
          audience: "test",
        },
      });

      customTestServer.addHook("preHandler", (req, reply, done) => {
        req.jwtVerify = vi.fn(async () => {
          throw new Error("Unauthorized");
        });
        done();
      });

      const customTestPort = testPort + 1;

      // Start listening.
      customTestServer.listen(
        { port: customTestPort, host: testHost },
        (err) => {
          if (err) {
            customTestServer.log.error(err);
            process.exit(1);
          } else {
            console.log(`[ ready ] http://${testHost}:${testPort}`);
          }
        },
      );

      const customTestTRPCClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${customTestPort}`,
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

      await expect(() =>
        customTestTRPCClient.test.query(),
      ).rejects.toThrowError(
        new TRPCError({
          code: "UNAUTHORIZED",
        }),
      );
    });
  });
});
