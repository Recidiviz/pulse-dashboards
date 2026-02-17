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

/**
 * One of two procedures corresponding to the "enable" action in the staff UI.
 * If there is already a non-stale RNA, set the enabledAt date, making it enabled.
 */
export const setRNAEnabled = stateStaffProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ input: { id }, ctx: { prisma } }) => {
    try {
      await prisma.usNcRNA.update({
        where: {
          id,
          enabledAt: null,
        },
        data: {
          enabledAt: new Date(),
        },
      });
    } catch (e) {
      throw new TRPCError({
        code: "CONFLICT",
        cause: e,
        message: "This assessment could not be marked as enabled.",
      });
    }
  });
