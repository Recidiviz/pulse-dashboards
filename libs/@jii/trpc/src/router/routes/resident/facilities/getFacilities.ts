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
import { ascending } from "d3-array";

import { AtLeastOne, isAtLeastOne } from "~utils";

import { firebaseAuthedResidentProcedure } from "../../../../procedures/firebaseAuthedResidentProcedure";

type FacilityResponse = { id: string; name: string };

/**
 * Returned data is guaranteed to be a nonempty array; will error if no results are found
 */
export const getFacilities = firebaseAuthedResidentProcedure.query(
  async ({
    ctx: { userProfile, prisma },
  }): Promise<AtLeastOne<FacilityResponse>> => {
    const hasPermission = userProfile.permissions?.includes("enhanced");
    if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

    const facilities = (
      await prisma.incarcerationFacility.findMany({
        select: { id: true, name: true },
      })
    )
      // name is technically nullable in the BQ export, in which case we patch it with the ID
      // (in most cases BQ will already have done the same when we don't have names ingested)
      .map(({ id, name }) => ({ id, name: name ?? id }))
      .sort((a, b) => ascending(a.name, b.name));

    if (!isAtLeastOne(facilities))
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No facilities found",
      });
    return facilities;
  },
);
