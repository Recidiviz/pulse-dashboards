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

import Fastify from "fastify";
import { beforeEach, describe, expect, test } from "vitest";

import { registerNoStoreHook } from "./cacheControl";

function buildTestServer() {
  const server = Fastify();

  // buildCommonServer registers the tRPC router as a plugin before buildServer adds the hook,
  // so this route is registered the same way
  server.register(async (plugin) => {
    plugin.get("/api/trpc/someQuery", async (_request, reply) => {
      reply.status(404).send({ error: "not found" });
    });
  });

  registerNoStoreHook(server);

  server.get("/api/v1/ok", async () => ({ ok: true }));
  server.get("/api/v1/cacheable", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=60").send({ ok: true });
  });

  return server;
}

let testServer: ReturnType<typeof buildTestServer>;

beforeEach(() => {
  testServer = buildTestServer();
});

describe("registerNoStoreHook", () => {
  test("marks a successful response as no-store", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/api/v1/ok",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  test("marks a 404 from a route registered in a plugin before the hook as no-store", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/api/trpc/someQuery",
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  test("marks a 404 for an unknown route as no-store", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/api/v1/does-not-exist",
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  test("keeps a Cache-Control header the route set itself", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/api/v1/cacheable",
    });

    expect(response.headers["cache-control"]).toBe("public, max-age=60");
  });
});
