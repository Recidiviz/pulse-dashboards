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

import { residentsConfigByState, StateCode } from "~@jii/configs";
import { ResidentFlagId } from "~@jii/prisma";
import { typedFromEntries } from "~utils";

import { residentRestrictedMiddleware } from "../../../middleware/residentRestrictedMiddleware";
import { firebaseAuthedResidentProcedure } from "../../../procedures/firebaseAuthedResidentProcedure";

export const getFlags = firebaseAuthedResidentProcedure
  .input(z.object({ pseudonymizedId: z.string() }))
  .use(residentRestrictedMiddleware)
  .query(async ({ ctx, input: { pseudonymizedId } }) => {
    if (ctx.userProfile.permissions?.includes("all_resident_flags_enabled")) {
      return typedFromEntries(
        Object.values(ResidentFlagId).map((id) => [id, true]),
      );
    }

    const [personalFlagInstances, residentFacility] = await Promise.all([
      ctx.prisma.residentFlagInstance.findMany({
        where: {
          pseudonymizedId,
          effectiveAt: { lte: new Date() },
        },
        select: { flagId: true },
      }),
      ctx.prisma.resident.findUnique({
        where: { pseudonymizedId },
        select: { facilityId: true },
      }),
    ]);
    const personalFlags = typedFromEntries(
      personalFlagInstances.map((r) => [r.flagId, true]),
    );

    const now = new Date();

    // values from the config objects can never turn off individual flags, only turn on additional ones

    const statewideFlagsConfig =
      residentsConfigByState[ctx.stateCode as StateCode]
        ?.enabledResidentFlags ?? {};
    const statewideFlags = typedFromEntries(
      Object.entries(statewideFlagsConfig)
        .filter(([, date]) => date <= now)
        .map(([id]) => [id as ResidentFlagId, true]),
    );

    // in practice residentFacility should always exist, but this will fall back
    // to an empty object regardless so there is no need to throw an error here.
    // facilityId can definitely be null though so the outer guard is serving a real purpose
    const facilityFlagsConfig = residentFacility?.facilityId
      ? residentsConfigByState[ctx.stateCode as StateCode]
          ?.enabledResidentFacilityFlags?.[residentFacility.facilityId] ?? {}
      : {};

    const facilityFlags = typedFromEntries(
      Object.entries(facilityFlagsConfig)
        .filter(([, date]) => date <= now)
        .map(([id]) => [id as ResidentFlagId, true]),
    );

    return {
      ...personalFlags,
      ...facilityFlags,
      ...statewideFlags,
    };
  });
