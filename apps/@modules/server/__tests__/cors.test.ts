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

import { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildServer } from "../src/server";
import {
  corsOriginsFromEnv,
  LOCALHOST_ORIGIN,
} from "../src/server/corsOrigins";

const PUBLIC_SITE = "https://calendar.example.org";
const STAFF_DASHBOARD = "https://dashboard-staging.recidiviz.org";
const STAFF_PREVIEW_PATTERN =
  "https://recidiviz-dashboard-stag-e1108--*.web.app";
const STAFF_PREVIEW =
  "https://recidiviz-dashboard-stag-e1108--pr-123-ab12cd34.web.app";
const OTHER_SITE = "https://evil.example";
const LOCAL_FRONTEND = "http://localhost:3000";
const PUBLIC_PATH = "/Calendar.usCo.paroleBoard.public.months.get";

let server: FastifyInstance | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.unstubAllEnvs();
});

function buildWithCorsOrigins(origins: string | undefined) {
  vi.stubEnv("CORS_ORIGINS", origins);
  server = buildServer();
  return server;
}

async function preflightAllowOrigin(origin: string) {
  const response = await server?.inject({
    method: "OPTIONS",
    url: PUBLIC_PATH,
    headers: {
      origin,
      "access-control-request-method": "GET",
    },
  });
  return response?.headers["access-control-allow-origin"];
}

// The CORS headers are set before the handler runs, so they arrive even
// though no calendar database backs the route in this test.
async function getAllowOrigin(origin: string) {
  const response = await server?.inject({
    method: "GET",
    url: PUBLIC_PATH,
    headers: { origin },
  });
  return response?.headers["access-control-allow-origin"];
}

describe("Modules CORS on the public calendar route", () => {
  describe("with CORS_ORIGINS set", () => {
    const origins = [PUBLIC_SITE, STAFF_DASHBOARD, STAFF_PREVIEW_PATTERN].join(
      ",",
    );

    it.each([PUBLIC_SITE, STAFF_DASHBOARD, STAFF_PREVIEW])(
      "echoes the listed origin %s",
      async (origin) => {
        buildWithCorsOrigins(origins);

        expect(await preflightAllowOrigin(origin)).toBe(origin);
      },
    );

    it("sends no allow-origin header to an unknown origin", async () => {
      buildWithCorsOrigins(origins);

      expect(await preflightAllowOrigin(OTHER_SITE)).toBeUndefined();
    });

    it("answers a GET of the public route the same way", async () => {
      buildWithCorsOrigins(origins);

      expect(await getAllowOrigin(PUBLIC_SITE)).toBe(PUBLIC_SITE);
      expect(await getAllowOrigin(OTHER_SITE)).toBeUndefined();
    });
  });

  it("answers only localhost when CORS_ORIGINS is unset", async () => {
    buildWithCorsOrigins(undefined);

    expect(await preflightAllowOrigin(LOCAL_FRONTEND)).toBe(LOCAL_FRONTEND);
    expect(await preflightAllowOrigin(OTHER_SITE)).toBeUndefined();
  });
});

describe("corsOriginsFromEnv", () => {
  beforeEach(() => {
    vi.stubEnv("DEPLOY_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("appends localhost in staging", () => {
    vi.stubEnv("DEPLOY_ENV", "staging");
    vi.stubEnv("CORS_ORIGINS", STAFF_DASHBOARD);

    expect(corsOriginsFromEnv()).toEqual([STAFF_DASHBOARD, LOCALHOST_ORIGIN]);
  });

  it("does not append localhost in production", () => {
    vi.stubEnv("DEPLOY_ENV", "production");
    vi.stubEnv("CORS_ORIGINS", STAFF_DASHBOARD);

    expect(corsOriginsFromEnv()).toEqual([STAFF_DASHBOARD]);
  });

  it("returns exact origins as trimmed strings", () => {
    vi.stubEnv("DEPLOY_ENV", "production"); // Don't append localhost
    vi.stubEnv("CORS_ORIGINS", ` ${STAFF_DASHBOARD},, ${PUBLIC_SITE} ,`);

    expect(corsOriginsFromEnv()).toEqual([STAFF_DASHBOARD, PUBLIC_SITE]);
  });

  it("turns a * entry into an anchored pattern over one hostname label", () => {
    vi.stubEnv("CORS_ORIGINS", STAFF_PREVIEW_PATTERN);

    const [matcher] = corsOriginsFromEnv();

    expect(matcher).toBeInstanceOf(RegExp);
    if (!(matcher instanceof RegExp)) return;
    expect(STAFF_PREVIEW).toMatch(matcher);
    expect(`${STAFF_PREVIEW}.evil.example`).not.toMatch(matcher);
    expect("https://recidiviz-dashboard-stag-e1108--a.b.web.app").not.toMatch(
      matcher,
    );
    expect("https://other-project--pr-1.web.app").not.toMatch(matcher);
  });

  it.each([undefined, "", " , "])(
    "allows only localhost origins for %j",
    (value) => {
      vi.stubEnv("CORS_ORIGINS", value);

      const matchers = corsOriginsFromEnv();

      expect(matchers).toHaveLength(1);
      const [matcher] = matchers;
      expect(matcher).toBeInstanceOf(RegExp);
      if (!(matcher instanceof RegExp)) return;
      expect(LOCAL_FRONTEND).toMatch(matcher);
      expect("https://localhost").toMatch(matcher);
      expect("https://localhost.evil.example").not.toMatch(matcher);
    },
  );
});
