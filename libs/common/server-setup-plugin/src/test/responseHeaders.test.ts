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

import { describe, expect, test } from "vitest";

import { buildCommonServer } from "~server-setup-plugin";
import {
  createAuth0Context,
  testAuth0Router,
} from "~server-setup-plugin/test/utils/auth0";

describe("response headers", () => {
  const server = buildCommonServer({
    createContext: createAuth0Context,
    appRouter: testAuth0Router,
    auth0Options: { domain: "test", audience: "test" },
  });
  server.addHook("preHandler", (req, _reply, done) => {
    req.jwtVerify = async () => undefined;
    req.user = "test user";
    done();
  });

  test.each([
    ["strict-transport-security", "max-age=31536000; includeSubDomains"],
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["content-security-policy", "default-src 'none'; frame-ancestors 'none'"],
  ])("sends %s on a JSON response", async (header, value) => {
    const response = await server.inject({
      method: "GET",
      url: "/test",
      headers: { authorization: "Bearer test-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.headers[header]).toBe(value);
  });

  test("sends them on an error response too", async () => {
    const response = await server.inject({ method: "GET", url: "/missing" });

    expect(response.statusCode).toBe(404);
    expect(response.headers["content-security-policy"]).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});
