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
import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { type AgencyConfig } from "~@meetings/config";
import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import { getGlobalPrismaClient } from "~@meetings/prisma";
import {
  auth0Procedure,
  recidivizStatelessProcedure,
  router,
} from "~@meetings/trpc/init";

export const configRouter = router({
  getAll: auth0Procedure.query((): Record<string, AgencyConfig> => {
    return AGENCY_CONFIGS;
  }),
  getNames: recidivizStatelessProcedure.query(
    async (): Promise<Record<string, string | undefined>> => {
      const prisma = getGlobalPrismaClient();
      const rows = await prisma.agencyConfig.findMany({
        orderBy: { version: "desc" },
      });

      const result: Record<string, string | undefined> = {};
      for (const row of rows) {
        if (row.id in result) continue;
        if (!row.parentId) {
          result[row.id] = undefined;
        } else {
          const config = parseYaml(row.config) as { name?: string };
          result[row.id] = config.name;
        }
      }

      return result;
    },
  ),

  getByState: recidivizStatelessProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }): Promise<string> => {
      const prisma = getGlobalPrismaClient();
      const row = await prisma.agencyConfig.findFirst({
        where: { id: input.id },
        orderBy: { version: "desc" },
        select: { config: true },
      });
      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No config found for id: ${input.id}`,
        });
      }
      return row.config;
    }),
});
