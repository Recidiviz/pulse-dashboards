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

import { z } from "zod";

import { stateStaffProcedure } from "./stateStaffProcedure";

/**
 * One of two procedures corresponding to the "enable" action in the staff UI.
 * If there is no RNA, or the RNA is stale, this action creates a new RNA.
 */
export const createRNA = stateStaffProcedure
  .input(z.object({ pseudonymizedId: z.string() }))
  .mutation(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
    // No RNA exists, or the RNA is stale, so make a new one
    await prisma.usNcRNA.create({
      data: {
        pseudonymizedId,
        enabledAt: new Date(),
        answers: {},
      },
    });
  });
