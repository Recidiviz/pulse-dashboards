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

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "~@idaho-th/prisma/client";

const prismaClients: Record<string, PrismaClient> = {};

/**
 * Builds the database connection string for the given state code.
 *
 * Supports two patterns:
 * 1. Single-DB environments (local dev, contractor): DATABASE_URL is set directly
 * 2. Multi-DB environments (deployed Cloud SQL): construct per-state URL from parts
 */
function buildConnectionString(stateCode: string): string {
  // Single-DB environments (local dev, contractor): DATABASE_URL is set directly
  if (process.env["DATABASE_URL"]) {
    return process.env["DATABASE_URL"];
  }

  // Multi-DB environments (deployed Cloud SQL): construct per-state URL from parts
  const user = process.env["DATABASE_USER"];
  const password = process.env["DATABASE_PASSWORD"];
  const connectionName = process.env["DATABASE_INSTANCE_CONNECTION_NAME"];

  if (!user || !password || !connectionName) {
    throw Error(
      "Missing required database connection environment variables: set DATABASE_URL, or set DATABASE_USER + DATABASE_PASSWORD + DATABASE_INSTANCE_CONNECTION_NAME",
    );
  }

  const url = new URL("postgresql://");
  url.hostname = "localhost";
  url.username = user;
  url.password = password;
  url.pathname = `/${stateCode.toLowerCase()}`;
  url.searchParams.set("host", `/cloudsql/${connectionName}`);
  url.searchParams.set("schema", "public");
  return url.toString();
}

/**
 * Gets or creates a Prisma client for the given state code.
 *
 * NOTE: For this prototype, we only support US_ID, but the pattern
 * supports multi-state deployments in the future.
 */
export function getPrismaClientForStateCode(stateCode: string) {
  const connectionString = buildConnectionString(stateCode);

  if (!prismaClients[connectionString]) {
    const adapter = new PrismaPg({ connectionString });
    prismaClients[connectionString] = new PrismaClient({ adapter });
  }

  return prismaClients[connectionString];
}

/**
 * Disconnects all Prisma clients.
 * Useful for cleanup in tests and graceful shutdown.
 */
export async function disconnectAllPrismaClients(): Promise<void> {
  await Promise.all(
    Object.values(prismaClients).map((client) => client.$disconnect()),
  );
}
