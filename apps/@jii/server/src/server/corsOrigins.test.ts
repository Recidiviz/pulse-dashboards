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

import { afterEach, describe, expect, test, vi } from "vitest";

import { corsOriginsFromEnv } from "./corsOrigins";

describe("corsOriginsFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns exact origins as strings", () => {
    vi.stubEnv(
      "CORS_ORIGINS",
      "https://opportunities.app, https://dashboard.recidiviz.org",
    );

    expect(corsOriginsFromEnv()).toEqual([
      "https://opportunities.app",
      "https://dashboard.recidiviz.org",
    ]);
  });

  test("turns a * entry into an anchored pattern over one hostname label", () => {
    vi.stubEnv("CORS_ORIGINS", "https://site--*.web.app");

    const [matcher] = corsOriginsFromEnv();

    expect(matcher).toBeInstanceOf(RegExp);
    expect("https://site--pr-12-ab3c.web.app").toMatch(matcher as RegExp);
    expect("https://site--pr-12.web.app.evil.example").not.toMatch(
      matcher as RegExp,
    );
    expect("https://other.web.app").not.toMatch(matcher as RegExp);
  });

  test("allows localhost when unset outside staging and production", () => {
    vi.stubEnv("CORS_ORIGINS", "");
    vi.stubEnv("DEPLOY_ENV", "development");

    const [matcher] = corsOriginsFromEnv();

    expect("http://localhost:3000").toMatch(matcher as RegExp);
    expect("https://localhost").toMatch(matcher as RegExp);
    expect("https://localhost.evil.example").not.toMatch(matcher as RegExp);
  });

  test.each(["staging", "production"])(
    "refuses to start without a list when DEPLOY_ENV is %s",
    (deployEnv) => {
      vi.stubEnv("CORS_ORIGINS", "");
      vi.stubEnv("DEPLOY_ENV", deployEnv);

      expect(() => corsOriginsFromEnv()).toThrow("CORS_ORIGINS must be set");
    },
  );
});
