import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import superjson from "superjson";
import { beforeAll, beforeEach } from "vitest";

import { buildServer } from "~sentencing-server/server";
import { seed } from "~sentencing-server/test/setup/seed";
import { AppRouter } from "~sentencing-server/trpc/router";

const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3003;

export let testTRPCClient: CreateTRPCProxyClient<AppRouter>;
export let testServer: ReturnType<typeof buildServer>;

beforeAll(async () => {
  const host = process.env["HOST"] ?? "localhost";

  testServer = buildServer();

  // Start listening.
  testServer.listen({ port, host }, (err) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${host}:${port}`);
    }
  });

  testTRPCClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3003",
      }),
    ],
    // Required to get Date objects to serialize correctly.
    transformer: superjson,
  });
});

beforeEach(async () => {
  await seed();
});
