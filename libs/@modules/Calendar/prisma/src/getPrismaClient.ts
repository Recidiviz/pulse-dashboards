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

import { PrismaClient } from "./client/client";

/** The Prisma client for one state's Calendar database. */
export type CalendarPrismaClient = PrismaClient;

const clients = new Map<string, CalendarPrismaClient>();

/**
 * Returns the Prisma client for a state's Calendar database, creating it on
 * first use and reusing it after that.
 *
 * The state is required, so a caller passes the state the user is authorized
 * for and never lands on another state's database by default. The client
 * reads CALENDAR__<STATE>_DATABASE_URL and never the shared DATABASE_URL, so
 * Calendar queries can't reach another module's database.
 *
 * A state has a Calendar database when its variable is set. Throws when it
 * is unset, naming the variable but never printing a URL, so a missing secret
 * or a state with no Calendar fails with the variable's name instead of a
 * connection error.
 */
export function getPrismaClient(stateCode: string): CalendarPrismaClient {
  const existing = clients.get(stateCode);
  if (existing) {
    return existing;
  }

  const variable = `CALENDAR__${stateCode}_DATABASE_URL`;
  const connectionString = process.env[variable];
  if (!connectionString) {
    throw new Error(`${variable} is not set`);
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  clients.set(stateCode, client);
  return client;
}
