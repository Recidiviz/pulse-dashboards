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

import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { firebaseAuthedResidentProcedure } from "../../../../procedures/firebaseAuthedResidentProcedure";

const residentInputSchema = z.object({ pseudonymizedId: z.string() });

/**
 * Returns a full resident record, with untyped state-specific-data. Clients are responsible
 * for parsing this locally to avoid off-by-one errors in calendar dates (because the server
 * casts them to midnight UTC when creating Date objects).
 */
export const getResident = firebaseAuthedResidentProcedure
  .input(residentInputSchema)
  .use(residentRestrictedMiddleware)
  .query(async ({ ctx: { prisma }, input: { pseudonymizedId } }) => {
    const resident = await prisma.resident.findUnique({
      where: { pseudonymizedId },
    });

    if (!resident) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Resident ${pseudonymizedId} could not be found.`,
      });
    }

    return resident;
  });
