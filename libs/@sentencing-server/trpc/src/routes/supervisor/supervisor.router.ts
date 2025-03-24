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

import { TRPCError } from "@trpc/server";

import { baseProcedure, router } from "~@sentencing-server/trpc/init";
import { PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR } from "~@sentencing-server/trpc/routes/supervisor/constants";
import { getSupervisorInputSchema } from "~@sentencing-server/trpc/routes/supervisor/supervisor.schema";
import { getSupervisorDashboardStats } from "~@sentencing-server/trpc/routes/supervisor/utils";

export const supervisorRouter = router({
  getSupervisor: baseProcedure
    .input(getSupervisorInputSchema)
    .query(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
      const supervisor = await prisma.staff.findUnique({
        where: {
          pseudonymizedId,
        },
        ...PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR,
      });

      if (!supervisor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        });
      }

      const supervisorDashboardStats = await getSupervisorDashboardStats(
        supervisor,
        prisma,
      );

      return {
        ...supervisor,
        externalId: undefined,
        supervisorDashboardStats,
      };
    }),
});
