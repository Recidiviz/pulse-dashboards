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

const ALLOWED_ORIGIN = "https://dashboard.example.org";
const PREVIEW_ORIGIN = "https://app--pr-12-abc.web.app";
const OTHER_ORIGIN = "https://evil.example";

function buildServer(corsOrigins?: (string | RegExp)[]) {
  const server = buildCommonServer({
    createContext: createAuth0Context,
    appRouter: testAuth0Router,
    auth0Options: { domain: "test", audience: "test" },
    corsOrigins,
  });
  server.addHook("preHandler", (req, _reply, done) => {
    req.jwtVerify = async () => undefined;
    req.user = "test user";
    done();
  });
  return server;
}

function preflight(origin: string) {
  return {
    method: "OPTIONS" as const,
    url: "/test",
    headers: {
      origin,
      "access-control-request-method": "GET",
      "access-control-request-headers": "authorization",
    },
  };
}

describe("cors", () => {
  describe("with an origin allowlist", () => {
    const server = buildServer([
      ALLOWED_ORIGIN,
      /^https:\/\/app--pr-\d+-[a-z0-9]+\.web\.app$/,
    ]);

    test("echoes a listed origin on preflight and marks the response as varying by origin", async () => {
      const response = await server.inject(preflight(ALLOWED_ORIGIN));

      expect(response.statusCode).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(
        ALLOWED_ORIGIN,
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
      expect(response.headers["access-control-allow-methods"]).toContain("GET");
      expect(response.headers["vary"]).toContain("Origin");
    });

    test("matches a RegExp entry", async () => {
      const response = await server.inject(preflight(PREVIEW_ORIGIN));

      expect(response.headers["access-control-allow-origin"]).toBe(
        PREVIEW_ORIGIN,
      );
    });

    test("sends no allow-origin header to an origin that is not listed", async () => {
      const response = await server.inject(preflight(OTHER_ORIGIN));

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("sends no allow-origin header on an actual request from an unlisted origin", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: { origin: OTHER_ORIGIN },
      });

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("leaves a request with no Origin header alone, as server-to-server callers send none", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: { authorization: "Bearer test-token" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("never answers with the wildcard", async () => {
      const response = await server.inject(preflight(ALLOWED_ORIGIN));

      expect(response.headers["access-control-allow-origin"]).not.toBe("*");
    });
  });

  describe("without an allowlist", () => {
    test("keeps answering every origin with the wildcard", async () => {
      const response = await buildServer().inject(preflight(OTHER_ORIGIN));

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });
});
