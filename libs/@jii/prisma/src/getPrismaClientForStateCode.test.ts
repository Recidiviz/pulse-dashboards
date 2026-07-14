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

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./client/client";
import { getDevDatabaseUrl } from "./utils";

vi.mock("@prisma/adapter-pg");
vi.mock("./client/client", () => ({ PrismaClient: vi.fn() }));

// getPrismaClientForStateCode.ts keeps a module-level `prismaClients` cache
// keyed by resolved connection string, so the SAME dbUrl resolved in two
// different tests would silently be served from cache in the second test
// (the mocked PrismaPg/PrismaClient constructors wouldn't be called again).
let getPrismaClientForStateCode: typeof import("./getPrismaClientForStateCode").getPrismaClientForStateCode;

beforeEach(async () => {
  // need to return a unique object for each call
  // so we can verify cache behavior. but also need to mock it
  // so that the mock envvars don't cause spurious errors
  vi.mocked(PrismaClient).mockImplementation(() => ({}) as PrismaClient);

  // ensures we reset the internal state of the module we are about to import,
  // specifically to reset the Prisma client cache. Mocks should be unaffected by this,
  // Vitest manages them separately
  vi.resetModules();
  ({ getPrismaClientForStateCode } = await import(
    "./getPrismaClientForStateCode"
  ));
});

describe("getPrismaClientForStateCode", () => {
  test("returns the same client instance for the same state code", () => {
    const firstClient = getPrismaClientForStateCode("US_XX");
    const secondClient = getPrismaClientForStateCode("US_XX");

    expect(secondClient).toBe(firstClient);
  });

  describe("test environment", () => {
    test("passes DATABASE_URL as the connection string", () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("DATABASE_URL", "postgresql://test-host/testdb");

      getPrismaClientForStateCode("US_XX");

      expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
        connectionString: "postgresql://test-host/testdb",
      });
    });

    test("throws when DATABASE_URL is not set", () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("DATABASE_URL", "");

      expect(() => getPrismaClientForStateCode("US_XX")).toThrow(
        "Attempted to access unsupported database for state US_XX",
      );
    });
  });

  describe("development environment", () => {
    test("derives the connection string from the state code", () => {
      vi.stubEnv("NODE_ENV", "development");

      getPrismaClientForStateCode("US_XX");

      expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
        connectionString: getDevDatabaseUrl("US_XX"),
      });
    });

    describe("offline mode", () => {
      test("passes DATABASE_URL as the connection string", () => {
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("IS_OFFLINE", "true");
        vi.stubEnv("DATABASE_URL", "postgresql://offline-host/testdb");

        getPrismaClientForStateCode("US_XX");

        expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
          connectionString: "postgresql://offline-host/testdb",
        });
      });

      test("falls back to the per-state dev DB when DATABASE_URL is not set", () => {
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("IS_OFFLINE", "true");
        vi.stubEnv("DATABASE_URL", "");

        getPrismaClientForStateCode("US_XX");

        expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
          connectionString: getDevDatabaseUrl("US_XX"),
        });
      });
    });

    describe("staging DB", () => {
      test("derives the connection string from STAGING_DB_USER and STAGING_DB_PASSWORD", () => {
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("USE_STAGING_DB", "true");
        vi.stubEnv("STAGING_DB_USER", "staging-user");
        vi.stubEnv("STAGING_DB_PASSWORD", "staging-password");

        getPrismaClientForStateCode("US_XX");

        expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
          connectionString:
            "postgresql://staging-user:staging-password@localhost:5432/us_xx?host=127.0.0.1",
        });
      });
    });
  });

  describe("production environment", () => {
    test("passes the state-specific DATABASE_URL as the connection string", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DATABASE_URL_US_XX", "postgresql://prod-host/us_xx");

      getPrismaClientForStateCode("US_XX");

      expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
        connectionString: "postgresql://prod-host/us_xx",
      });
    });

    test("throws when the state-specific DATABASE_URL is not set", () => {
      vi.stubEnv("NODE_ENV", "production");

      expect(() => getPrismaClientForStateCode("US_XX")).toThrow(
        "Attempted to access unsupported database for state US_XX",
      );
    });
  });
});
