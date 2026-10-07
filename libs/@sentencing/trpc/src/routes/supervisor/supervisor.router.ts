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

import { baseProcedure, router } from "~@sentencing/trpc/init";
import { PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR } from "~@sentencing/trpc/routes/supervisor/constants";
import { getSupervisorInputSchema } from "~@sentencing/trpc/routes/supervisor/supervisor.schema";
import { getSupervisorDashboardStats } from "~@sentencing/trpc/routes/supervisor/utils";

export const supervisorRouter = router({
  getSupervisor: baseProcedure
    .input(getSupervisorInputSchema)
    .query(
      async ({
        input: { pseudonymizedId: requestedPseudonymizedId },
        ctx: { prisma, staffPseudonymizedId },
      }) => {
        // State users may only request their own team. The client always
        // sends the user's own ID, so a mismatch means a bug or someone probing;
        // the FORBIDDEN is logged by the server's tRPC onError handler.
        // Recidiviz internal users have no JWT pseudo ID and may request any
        // ID, which keeps impersonation working.
        if (
          staffPseudonymizedId &&
          requestedPseudonymizedId !== staffPseudonymizedId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this supervisor",
          });
        }
        const supervisor = await prisma.staff.findUnique({
          where: {
            pseudonymizedId: requestedPseudonymizedId,
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
      },
    ),
});
