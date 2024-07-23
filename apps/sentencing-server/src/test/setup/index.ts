import { init } from "@sentry/node";
import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import sentryTestkit from "sentry-testkit";
import superjson from "superjson";
import { beforeAll, beforeEach, vi } from "vitest";

import { buildServer } from "~sentencing-server/server";
import { seed } from "~sentencing-server/test/setup/seed";
import { resetDb } from "~sentencing-server/test/setup/utils";
import { AppRouter } from "~sentencing-server/trpc/router";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: CreateTRPCProxyClient<AppRouter>;
export let testServer: ReturnType<typeof buildServer>;

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

beforeAll(async () => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
  });

  testServer = buildServer();

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

  testTRPCClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
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
});

beforeEach(async () => {
  await resetDb();
  await seed();

  testkit.reset();
});
