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

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Client } from "pg";

// Replays the real, shipped migration files against throwaway databases, for
// tests of migrations that run once against production data. Each test file
// builds a baseline up to the migration under test, then copies it per test
// with CREATE DATABASE ... TEMPLATE rather than replaying every file again.

/**
 * The migrations ship from the sibling `@idaho-th/prisma` package. cwd differs
 * between an nx-invoked run (this project's root) and a direct `vitest`
 * invocation from the monorepo root, so try both — mirrors the candidate-path
 * pattern in intercom.template.ts's resolveDigestTemplatePath.
 */
function resolveMigrationsDir(): string {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "..", "prisma", "prisma", "migrations"),
    join(cwd, "libs", "@idaho-th", "prisma", "prisma", "migrations"),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      `Could not locate the prisma migrations directory; tried: ${candidates.join(", ")}`,
    );
  }
  return found;
}

const MIGRATIONS_DIR = resolveMigrationsDir();

// Lexicographic order by directory name, which is the order Prisma applies.
const MIGRATION_NAMES = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function indexOfMigration(name: string): number {
  const index = MIGRATION_NAMES.indexOf(name);
  if (index === -1) {
    throw new Error(`Migration ${name} is not in ${MIGRATIONS_DIR}`);
  }
  return index;
}

export function migrationsBefore(name: string): string[] {
  return MIGRATION_NAMES.slice(0, indexOfMigration(name));
}

export function migrationsAfter(name: string): string[] {
  return MIGRATION_NAMES.slice(indexOfMigration(name) + 1);
}

/**
 * Runs one migration file as a single simple query, which Postgres executes in
 * an implicit transaction — the same all-or-nothing boundary Prisma uses, so a
 * failing precheck rolls the whole file back here too.
 */
export function applyMigration(db: Client, name: string): Promise<unknown> {
  return db.query(
    readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"),
  );
}

function scratchDbUrl(database: string): string {
  const configured = process.env["DATABASE_URL"];
  if (!configured) {
    throw new Error(
      "DATABASE_URL must point at the test Postgres instance to replay migrations.",
    );
  }
  const url = new URL(configured);
  url.pathname = `/${database}`;
  url.search = "";
  return url.toString();
}

async function withAdminClient<T>(
  run: (admin: Client) => Promise<T>,
): Promise<T> {
  const admin = new Client(scratchDbUrl("postgres"));
  await admin.connect();
  try {
    return await run(admin);
  } finally {
    await admin.end();
  }
}

const scratchDatabases: string[] = [];
const openClients: Client[] = [];

export async function createScratchDb(
  name: string,
  template?: string,
): Promise<Client> {
  await withAdminClient(async (admin) => {
    // FORCE drops any connection a crashed previous run left behind.
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.query(
      template
        ? `CREATE DATABASE "${name}" TEMPLATE "${template}"`
        : `CREATE DATABASE "${name}"`,
    );
  });
  scratchDatabases.push(name);
  const client = new Client(scratchDbUrl(name));
  await client.connect();
  openClients.push(client);
  return client;
}

/** Nothing may hold a connection to a database used as a TEMPLATE. */
export async function releaseTemplateDb(client: Client): Promise<void> {
  await client.end();
  openClients.splice(openClients.indexOf(client), 1);
}

/** afterAll hook: closes every client and drops every scratch database. */
export async function dropScratchDatabases(): Promise<void> {
  await Promise.all(openClients.map((client) => client.end()));
  await withAdminClient(async (admin) => {
    for (const name of [...scratchDatabases].reverse()) {
      // eslint-disable-next-line no-await-in-loop -- one admin connection
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    }
  });
}
