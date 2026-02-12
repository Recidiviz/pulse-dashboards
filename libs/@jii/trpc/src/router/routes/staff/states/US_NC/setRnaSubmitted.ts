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

import { stateStaffProcedure } from "./stateStaffProcedure";

export const setRNASubmitted = stateStaffProcedure
  .input(z.object({ id: z.string(), isSubmitted: z.boolean() }))
  .mutation(async ({ input: { id, isSubmitted }, ctx: { prisma } }) => {
    try {
      if (isSubmitted) {
        return await prisma.usNcRNA.update({
          where: {
            id,
            // can't submit an incomplete survey
            completedAt: {
              not: null,
            },
            // reject duplicate submissions
            submittedByStaffAt: null,
          },
          data: {
            submittedByStaffAt: new Date(),
          },
          select: {
            submittedByStaffAt: true,
          },
        });
      } else {
        return await prisma.usNcRNA.update({
          where: {
            id,
          },
          data: { submittedByStaffAt: null },
          select: { submittedByStaffAt: true },
        });
      }
    } catch (e) {
      throw new TRPCError({
        code: "CONFLICT",
        cause: e,
        message: "This assessment could not be marked as completed.",
      });
    }
  });
