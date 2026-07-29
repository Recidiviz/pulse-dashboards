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
import { getDevDatabaseUrl } from "./utils";

const prismaClients: Record<string, PrismaClient> = {};

type PrismaClientOpts = {
  stateCode: StateCode;
  demo: boolean;
};

export function getPrismaClient({ stateCode, demo }: PrismaClientOpts) {
  const stateDbName = `${stateCode}${demo ? "_DEMO" : ""}`.toLowerCase();
  const NODE_ENV = process.env["NODE_ENV"] ?? "";
  let dbUrl: string | undefined;

  // Because infra differs across environments, the way we resolve DB URLs does as well.
  switch (NODE_ENV) {
    // in test environments for convenience we collapse all states into single DB
    case "test":
      dbUrl = process.env["DATABASE_URL"];
      break;
    case "development":
      // this is only expected when running e2e tests against offline mode
      if (process.env["IS_OFFLINE"] === "true" && process.env["DATABASE_URL"]) {
        dbUrl = process.env["DATABASE_URL"];
      } else if (process.env["USE_STAGING_DB"] === "true") {
        // this URL points you to the local CloudSQL proxy for the staging DB
        dbUrl = `postgresql://${process.env["STAGING_DB_USER"]}:${process.env["STAGING_DB_PASSWORD"]}@localhost:5432/${stateDbName}?host=127.0.0.1`;
      } else {
        // otherwise use the local DB. we can construct the URL on the fly
        // from a predictable and non-sensitive template
        dbUrl = getDevDatabaseUrl(stateDbName);
        console.log(dbUrl);
      }
      break;
    // otherwise assume we're in a deployment, where the state db url must be explicitly provided
    default:
      dbUrl = process.env[`DATABASE_URL_${stateCode}`];
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
