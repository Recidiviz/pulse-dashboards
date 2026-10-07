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

import { handlePrismaError } from "~@sentencing/trpc/errors";
import { baseProcedure, router } from "~@sentencing/trpc/init";
import {
  buildStaffCaseFilter,
  fetchCasesForStaff,
  fetchStaffById,
  sanitizeStaffForResponse,
  transformCaseForResponse,
} from "~@sentencing/trpc/routes/staff/staff.helpers";
import {
  getStaffInputSchema,
  updateStaffSchema,
} from "~@sentencing/trpc/routes/staff/staff.schema";

export const staffRouter = router({
  getStaff: baseProcedure
    .input(getStaffInputSchema)
    .query(
      async ({
        input: { pseudonymizedId: requestedPseudonymizedId },
        ctx: { prisma, staffPseudonymizedId },
      }) => {
        // State users may only request their own record. The client always
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
            message: "You do not have access to this staff member",
          });
        }
        const staff = await fetchStaffById(prisma, requestedPseudonymizedId);
        const staffFilter = await buildStaffCaseFilter(prisma, staff);
        const cases = await fetchCasesForStaff(prisma, staffFilter);

        return {
          ...sanitizeStaffForResponse(staff),
          cases: cases.map((c) =>
            transformCaseForResponse(c, staff.pseudonymizedId),
          ),
        };
      },
    ),
  updateStaff: baseProcedure
    .input(updateStaffSchema)
    .mutation(
      async ({ input: { pseudonymizedId, hasLoggedIn }, ctx: { prisma } }) => {
        try {
          await prisma.staff.update({
            where: {
              pseudonymizedId,
            },
            data: {
              hasLoggedIn,
            },
          });
        } catch (e) {
          handlePrismaError(e, "Staff with that id was not found");
        }
      },
    ),
});
