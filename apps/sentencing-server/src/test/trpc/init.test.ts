import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";
import { describe, expect, test } from "vitest";

import { buildServer } from "~sentencing-server/server";
import { testHost, testPort } from "~sentencing-server/test/setup";
import { fakeCase } from "~sentencing-server/test/setup/seed";
import { AppRouter } from "~sentencing-server/trpc/router";

describe("init trpc", () => {
  describe("auth", () => {
    test("should throw error there is no authorization header", async () => {
      // Don't pass authorization headers
      const customTestTRPCClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${testPort}`,
          }),
        ],
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
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

    test("should throw error if not authorized", async () => {
      // Create a new server for this test that fails on auth
      const customTestServer = buildServer();

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

      const customTestTRPCClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://${testHost}:${customTestPort}`,
            headers() {
              return {
                Authorization: "Bearer test-token",
              };
            },
          }),
        ],
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
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
});
