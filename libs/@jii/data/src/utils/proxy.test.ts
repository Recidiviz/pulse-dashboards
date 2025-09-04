// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { proxyHost } from "./proxy";

const TEST_EDOVO_HOST = "opportunities.edovo.com";
const TEST_BASE_HOST = "opportunities.app";

describe("edovo proxy", () => {
  test("active on edovo domain hostname", () => {
    vi.stubGlobal("location", {
      hostname: TEST_EDOVO_HOST,
    });

    vi.stubEnv("VITE_EDOVO_REVERSE_PROXY_HOST", TEST_EDOVO_HOST);

    expect(proxyHost()).toBe(TEST_EDOVO_HOST);
  });

  test("takes precedence over base proxy", () => {
    vi.stubGlobal("location", {
      hostname: TEST_EDOVO_HOST,
    });

    vi.stubEnv("VITE_REVERSE_PROXY_HOST", TEST_BASE_HOST);
    vi.stubEnv("VITE_EDOVO_REVERSE_PROXY_HOST", TEST_EDOVO_HOST);

    expect(proxyHost()).toBe(TEST_EDOVO_HOST);
  });

  test("inactive if not on subdomain", () => {
    vi.stubEnv("VITE_EDOVO_REVERSE_PROXY_HOST", TEST_EDOVO_HOST);

    expect(proxyHost()).toBeUndefined();
  });

  test("inactive if env is missing", () => {
    vi.stubGlobal("location", {
      hostname: TEST_EDOVO_HOST,
    });
    expect(proxyHost()).toBeUndefined();
  });

  test("does not fall back to other proxy settings when triggered by URL", () => {
    vi.stubGlobal("location", {
      hostname: TEST_EDOVO_HOST,
    });

    vi.stubEnv("VITE_REVERSE_PROXY_HOST", TEST_BASE_HOST);

    expect(proxyHost()).toBeUndefined();
  });
});

describe("base proxy", () => {
  test("active based on env var", () => {
    vi.stubEnv("VITE_REVERSE_PROXY_HOST", TEST_BASE_HOST);
    expect(proxyHost()).toBe(TEST_BASE_HOST);
  });

  test("inactive if env is unset", () => {
    expect(proxyHost()).toBeUndefined();
  });

  test("edovo proxy setting ignored", () => {
    vi.stubEnv("VITE_REVERSE_PROXY_HOST", TEST_BASE_HOST);
    vi.stubEnv("VITE_EDOVO_REVERSE_PROXY_HOST", TEST_EDOVO_HOST);

    expect(proxyHost()).toBe(TEST_BASE_HOST);
  });
});
