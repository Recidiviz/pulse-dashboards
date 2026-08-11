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

import {
  isRealDatabaseEnvironment,
  resolveDatabaseTarget,
} from "./databaseTarget";

describe("resolveDatabaseTarget", () => {
  test("NODE_ENV=test", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(resolveDatabaseTarget()).toBe("local-test");
  });

  test("development environment, no special flags", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveDatabaseTarget()).toBe("local-dev");
  });

  test("development environment with IS_OFFLINE", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("IS_OFFLINE", "true");
    expect(resolveDatabaseTarget()).toBe("local-dev");
  });

  test("development environment pointed at the staging DB proxy", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("USE_STAGING_DB", "true");
    expect(resolveDatabaseTarget()).toBe("staging-proxy");
  });

  test("any other NODE_ENV is assumed to be a deployment", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveDatabaseTarget()).toBe("deployed");
  });
});

describe("isRealDatabaseEnvironment", () => {
  test("false in test environment", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(isRealDatabaseEnvironment()).toBe(false);
  });

  test("false for plain local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isRealDatabaseEnvironment()).toBe(false);
  });

  test("false for offline mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("IS_OFFLINE", "true");
    expect(isRealDatabaseEnvironment()).toBe(false);
  });

  test("true when pointed at the staging DB via the proxy, even though NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("USE_STAGING_DB", "true");
    expect(isRealDatabaseEnvironment()).toBe(true);
  });

  test("true when deployed", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isRealDatabaseEnvironment()).toBe(true);
  });
});
