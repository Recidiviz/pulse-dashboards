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

import { init } from "@sentry/node";
import { createTRPCClient, httpBatchLink, TRPCClient } from "@trpc/client";
import sentryTestkit from "sentry-testkit";
import superjson from "superjson";
import { beforeAll, beforeEach, vi } from "vitest";

import { AppRouter } from "~@case-notes-server/trpc";
import { buildServer } from "~case-notes-server/server";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3010;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: TRPCClient<AppRouter>;
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

  testTRPCClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
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
});

beforeEach(async () => {
  testkit.reset();
});
