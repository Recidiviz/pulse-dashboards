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

import { AppRouter } from "~@sentencing/trpc/router";
import { testHost, testPort } from "~@sentencing/trpc/test/setup";
import { fakeCase } from "~@sentencing/trpc/test/setup/seed";

describe("init trpc", () => {
  describe("auth", () => {
    test("should throw an error if authorization fails", async () => {
      // Don't pass authorization headers so that authorization fails
      const customTestTRPCClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${testPort}`,
            headers() {
              return {
                StateCode: "US_ID",
              };
            },
            // Required to get Date objects to serialize correctly.
            transformer: superjson,
          }),
        ],
      });

      await expect(() =>
        customTestTRPCClient.case.getCase.query({
          id: fakeCase.id,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "UNAUTHORIZED",
        }),
      );
    });
  });

  describe("state code", () => {
    test("should throw error if there is no state code in the header", async () => {
      // Don't pass a state code
      const customTestTRPCClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${testPort}`,
            headers() {
              return {
                Authorization: "Bearer test-token",
              };
            },
            // Required to get Date objects to serialize correctly.
            transformer: superjson,
          }),
        ],
      });

      await expect(() =>
        customTestTRPCClient.case.getCase.query({
          id: fakeCase.id,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Unsupported state code provided in request headers: undefined",
        }),
      );
    });

    test("should throw error if the state code isn't supported", async () => {
      const customTestTRPCClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${testPort}`,
            headers() {
              return {
                Authorization: "Bearer test-token",
                // This is technically a valid state code, but there isn't a prisma client available for it
                StateCode: "US_ME",
              };
            },
            // Required to get Date objects to serialize correctly.
            transformer: superjson,
          }),
        ],
      });

      await expect(() =>
        customTestTRPCClient.case.getCase.query({
          id: fakeCase.id,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Unsupported state code provided in request headers: US_ME",
        }),
      );
    });
  });
});
