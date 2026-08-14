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

import {
  type AgencyConfig,
  AgencyConfigFileSchema,
  BaseConfigFileSchema,
} from "~@meetings/config";
import { getGlobalPrismaClient } from "~@meetings/prisma";
import { type AgencyConfig as AgencyConfigRow } from "~@meetings/prisma/client";
import {
  auth0Procedure,
  recidivizStatelessProcedure,
  router,
} from "~@meetings/trpc/init";
import { getAgencyConfigs } from "~@meetings/trpc/routes/config/utils";

export const configRouter = router({
  getAll: auth0Procedure.query(
    async (): Promise<Record<string, AgencyConfig>> => {
      return getAgencyConfigs();
    },
  ),

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
    .query(async ({ input }): Promise<AgencyConfigRow> => {
      const prisma = getGlobalPrismaClient();
      const row = await prisma.agencyConfig.findFirst({
        where: { id: input.id },
        orderBy: { version: "desc" },
      });
      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No config found for id: ${input.id}`,
        });
      }
      return row;
    }),

  saveNewConfig: recidivizStatelessProcedure
    .input(
      z.object({
        newConfig: z.string(),
        id: z.string(),
        parentId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const prisma = getGlobalPrismaClient();
      const agencyConfigLatestVersion = await prisma.agencyConfig.findFirst({
        where: { id: input.id },
        orderBy: { version: "desc" },
        select: { version: true, parentId: true },
      });

      if (
        agencyConfigLatestVersion &&
        input.parentId !== agencyConfigLatestVersion?.parentId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change the parentId.",
        });
      }
      if (!agencyConfigLatestVersion && input.parentId !== null) {
        const validParent = await prisma.agencyConfig.findFirst({
          where: { id: input.parentId },
        });
        if (!validParent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parentId.",
          });
        }
      }

      const schema = input.parentId
        ? AgencyConfigFileSchema
        : BaseConfigFileSchema;

      let parsedYaml: unknown;
      try {
        parsedYaml = parseYaml(input.newConfig);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid YAML syntax.",
          cause: e,
        });
      }

      const newConfigParseResult = schema.safeParse(parsedYaml);
      if (!newConfigParseResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Configuration validation failed.",
          cause: newConfigParseResult.error,
        });
      }

      const newVersion = newConfigParseResult.data.version;
      const latestVersionNumber = agencyConfigLatestVersion?.version ?? 0;
      if (newVersion <= latestVersionNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid version number. Must be greater than ${latestVersionNumber}.`,
        });
      }

      if (input.parentId) {
        const { stateCode: newStateCode } =
          newConfigParseResult.data as z.infer<typeof AgencyConfigFileSchema>;
        if (newStateCode !== input.id.toUpperCase()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Id and stateCode mismatch.",
          });
        }
      }

      return await prisma.agencyConfig.create({
        data: {
          id: input.id,
          config: input.newConfig,
          parentId: input.parentId,
          version: newVersion,
        },
      });
    }),
});
