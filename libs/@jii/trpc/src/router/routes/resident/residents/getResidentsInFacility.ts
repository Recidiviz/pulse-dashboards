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

import { firebaseAuthedResidentProcedure } from "../../../../procedures/firebaseAuthedResidentProcedure";

export const getResidentsInFacility = firebaseAuthedResidentProcedure
  .input(z.object({ facilityId: z.string() }))
  .query(async ({ ctx: { userProfile, prisma }, input: { facilityId } }) => {
    const hasPermission = userProfile.permissions?.includes("enhanced");
    if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

    return prisma.resident.findMany({
      where: { facilityId },
      select: {
        givenNames: true,
        surname: true,
        displayId: true,
        pseudonymizedId: true,
      },
      orderBy: [
        {
          surname: "asc",
        },
        { givenNames: "asc" },
      ],
    });
  });
