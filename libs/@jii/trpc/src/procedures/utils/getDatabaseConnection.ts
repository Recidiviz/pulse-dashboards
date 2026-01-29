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

import { TRPCError } from "@trpc/server";

import { getPrismaClientForStateCode } from "~@jii/prisma";

/**
 * Returns a Prisma client for the specified database (state specific, live data or demo),
 * or throws if the database is not configured
 */
export function getDatabaseConnection(stateCode: string, useDemoDb: boolean) {
  let prismaClient;

  try {
    prismaClient = getPrismaClientForStateCode(
      `${stateCode}${useDemoDb ? "_DEMO" : ""}`,
    );
  } catch (e) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}${useDemoDb ? " (DEMO)" : ""}`,
      cause: e,
    });
  }

  return prismaClient;
}
