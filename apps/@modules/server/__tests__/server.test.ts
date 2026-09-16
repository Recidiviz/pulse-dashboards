// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import superjson from "superjson";
import { beforeAll } from "vitest";

import { AppRouter } from "~@modules-server/trpc";

import { testServer } from "./setup";

const testPort = process.env["PORT"] ? Number(process.env["PORT"]) : 3003;
const testHost = process.env["HOST"] ?? "localhost";

let testTRPCClient: TRPCClient<AppRouter>;

beforeAll(async () => {
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
            StateCode: "US_TN",
          };
        },
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
      }),
    ],
  });
});

describe("server", () => {
  it("should mount routes", async () => {
    const greeting = await testTRPCClient.hello.query();
    expect(greeting).toEqual("hi there");
  });

  it("should forbid access to protected routes", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/howdy",
    });

    expect(response.statusCode).toBe(401);
  });
});
