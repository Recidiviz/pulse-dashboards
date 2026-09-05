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

import { usNeStaffProcedure } from "../../../../../procedures/stateRestrictedStaffProcedureFactory";

/**
 * Create a new Check-In for the provided person with the provided ID.
 * If a check-in with the ID already exists, do nothing - IDs should be globally unique.
 */
export const createCheckIn = usNeStaffProcedure
  .input(
    z.object({
      pseudonymizedId: z.string(),
      id: z.string(),
    }),
  )
  .mutation(
    async ({ input: { pseudonymizedId, id }, ctx: { prisma, userId } }) => {
      await prisma.usNeCheckIn.upsert({
        where: {
          id,
        },
        update: {},
        create: {
          pseudonymizedId,
          id,
          assignedBy: userId,
          answers: {},
        },
      });
    },
  );
