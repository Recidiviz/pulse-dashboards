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

import { createTRPCClient, httpBatchLink, TRPCClient } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify/types/instance";
import fastifyAuth0Verify from "fastify-auth0-verify";
import superjson from "superjson";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createContext } from "~@sentencing/trpc/context";
import { AppRouter, appRouter } from "~@sentencing/trpc/router";
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

describe("stateCode JWT claim validation", () => {
  let mismatchServer: FastifyInstance;
  let mismatchClient: TRPCClient<AppRouter>;
  const mismatchPort = testPort + 10;

  beforeAll(async () => {
    mismatchServer = Fastify({ logger: false });
    mismatchServer.register(fastifyTRPCPlugin, {
      prefix: "",
      trpcOptions: {
        router: appRouter,
        createContext,
        onError({ path, error }) {
          console.error(`Error in tRPC handler on path '${path}':`, error);
        },
      } satisfies FastifyTRPCPluginOptions<typeof appRouter>["trpcOptions"],
    });
    mismatchServer.register(fastifyAuth0Verify, {
      domain: "domain",
      audience: "audience",
    });
    // JWT stateCode (us_ne) does not match the request StateCode header (US_ID)
    mismatchServer.addHook("preHandler", (req, _reply, done) => {
      req.jwtVerify = async () => {
        return;
      };
      req.user = {
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "us_ne",
          allowedStates: [],
        },
        "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
      };
      done();
    });
    await mismatchServer.listen({ port: mismatchPort, host: testHost });

    mismatchClient = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${mismatchPort}`,
          headers() {
            return {
              Authorization: "Bearer test-token",
              StateCode: "US_ID",
            };
          },
          transformer: superjson,
        }),
      ],
    });
  });

  afterAll(() => mismatchServer.close());

  test("should throw FORBIDDEN when JWT stateCode does not match header stateCode", async () => {
    await expect(() =>
      mismatchClient.case.getCase.query({ id: fakeCase.id }),
    ).rejects.toThrowError(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "User with state code US_NE cannot request data about state: US_ID",
      }),
    );
  });
});
