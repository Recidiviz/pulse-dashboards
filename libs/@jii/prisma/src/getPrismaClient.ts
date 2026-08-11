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

import { StateCode } from "~@jii/configs";

import { PrismaClient } from "./client/client";
import { resolveDatabaseTarget } from "./databaseTarget";
import { getLocalDatabaseUrl } from "./utils";

const prismaClients: Record<string, PrismaClient> = {};

type PrismaClientOpts = {
  stateCode: StateCode;
  demo: boolean;
};

export function getPrismaClient({ stateCode, demo }: PrismaClientOpts) {
  const stateDbName = `${stateCode}${demo ? "_DEMO" : ""}`.toLowerCase();
  let dbUrl: string | undefined;

  // Because infra differs across environments, the way we resolve DB URLs does as well.
  switch (resolveDatabaseTarget()) {
    // in the test environment for convenience we collapse all states into single DB
    case "local-test":
      dbUrl = process.env["DATABASE_URL"];
      break;
    // this URL points you to the local CloudSQL proxy for the staging DB
    case "staging-proxy":
      dbUrl = `postgresql://${process.env["STAGING_DB_USER"]}:${process.env["STAGING_DB_PASSWORD"]}@localhost:5432/${stateDbName}?host=127.0.0.1`;
      break;
    // the local DB URL can be constructed on the fly
    case "local-dev":
      dbUrl = getLocalDatabaseUrl(stateDbName);
      break;
    // in a deployment, the state db url must be explicitly provided to the container
    case "deployed":
      dbUrl = process.env[`DATABASE_URL_${stateDbName.toUpperCase()}`];
      break;
  }

  if (!dbUrl) {
    throw Error(
      `Attempted to access unsupported database for state ${stateCode}`,
    );
  }

  if (!prismaClients[dbUrl]) {
    const adapter = new PrismaPg({
      connectionString: dbUrl,
    });
    prismaClients[dbUrl] = new PrismaClient({ adapter });
  }

  return prismaClients[dbUrl];
}
