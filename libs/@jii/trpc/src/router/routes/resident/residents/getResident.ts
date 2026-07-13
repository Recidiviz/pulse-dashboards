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

import { findStateSchema } from "~@jii/schemas";

import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { firebaseAuthedResidentProcedure } from "../../../../procedures/firebaseAuthedResidentProcedure";

const residentInputSchema = z.object({ pseudonymizedId: z.string() });

/**
 * Returns a full resident record, including fully typed state-specific data as a discriminated union
 * (clients will still need to narrow it by the expected state code)
 * TODO(OBT-29534): can we avoid this by having the user include state code in the args?
 */
export const getResident = firebaseAuthedResidentProcedure
  .input(residentInputSchema)
  .use(residentRestrictedMiddleware)
  .query(async ({ ctx: { prisma, stateCode }, input: { pseudonymizedId } }) => {
    const resident = await prisma.resident.findUnique({
      where: { pseudonymizedId },
    });

    if (!resident) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Resident ${pseudonymizedId} could not be found.`,
      });
    }

    const ssdSchema = findStateSchema(stateCode);

    let validatedSSD;

    // SSD may exist in the DB but we don't return it until a schema has been defined
    if (ssdSchema) {
      validatedSSD = ssdSchema.parse(resident.stateSpecificData);
    }

    return { ...resident, stateSpecificData: validatedSSD };
  });
