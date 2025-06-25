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

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "~@sentencing/prisma/client";

const prismaClients: Record<string, PrismaClient> = {};

export function getPrismaClientForStateCode(stateCode: string) {
  const dbUrl = process.env[`DATABASE_URL_${stateCode}`];

  if (!dbUrl) {
    throw Error(
      `Attempted to access unsupported database for state ${stateCode}`,
    );
  }

  if (!prismaClients[dbUrl]) {
    const adapter = new PrismaPg({
      connectionString: process.env[`DATABASE_URL_${stateCode}`],
    });
    prismaClients[dbUrl] = new PrismaClient({ adapter });
  }

  return prismaClients[dbUrl];
}
