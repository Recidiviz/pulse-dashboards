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
import { z } from "zod";

import {
  getCheckInInputSchema,
  getCheckInQueryResolver,
} from "../../../../helpers/US_NE/checkIn";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { nebraskaProcedure } from "./nebraskaProcedure";

/**
 * Return the latest check-in corresponding to the provided resident, or null
 * if none was found.
 */
export const getCheckIn = nebraskaProcedure
  .input(getCheckInInputSchema)
  .use(residentRestrictedMiddleware)
  .query(getCheckInQueryResolver);

/**
 * Update the check-in identified by the given ID with the provided answers.
 *
 * Raises an error if there is a mismatch between the resident's pseudonymized ID
 * and the pseudonymized ID associated with this check-in.
 *
 * This will fully overwrite the user's answers stored in the db with whatever
 * is provided; it's the requester's responsibility to correctly join the user's
 * new answers with existing db info.
 */
export const updateCheckIn = nebraskaProcedure
  .input(
    z.object({
      id: z.string(),
      pseudonymizedId: z.string(),
      // TODO(OBT-47841) can this type be tightened?
      answers: z.record(z.string(), z.any()),
    }),
  )
  .use(residentRestrictedMiddleware)
  .mutation(async ({ ctx, input }) => {
    const checkIn = await ctx.prisma.usNeCheckIn.findFirst({
      where: {
        id: input.id,
      },
    });
    if (!checkIn) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Check-In with ID ${input.id} not found`,
      });
    }
    if (checkIn.pseudonymizedId !== input.pseudonymizedId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Resident ${input.pseudonymizedId} cannot update another person's Check-In (Check-In ID: ${input.id})`,
      });
    }

    return await ctx.prisma.usNeCheckIn.update({
      where: {
        id: input.id,
      },
      data: {
        answers: input.answers,
      },
    });
  });
