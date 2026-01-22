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

import { Prisma } from "~@sentencing/prisma/client";
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
    .query(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
      const staff = await fetchStaffById(prisma, pseudonymizedId);
      const staffFilter = await buildStaffCaseFilter(prisma, staff);
      const cases = await fetchCasesForStaff(prisma, staffFilter);

      return {
        ...sanitizeStaffForResponse(staff),
        cases: cases.map((c) =>
          transformCaseForResponse(c, staff.pseudonymizedId),
        ),
      };
    }),
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
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Staff with that id was not found",
              cause: e,
            });
          }
        }
      },
    ),
});
