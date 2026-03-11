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

import { ResidentFlagId } from "~@jii/prisma";
import { typedFromEntries } from "~utils";

import { residentRestrictedMiddleware } from "../../../middleware/residentRestrictedMiddleware";
import { firebaseAuthedResidentProcedure } from "../../../procedures/firebaseAuthedResidentProcedure";
import { router } from "../../../procedures/init";

export const residentRouter = router({
  getFlags: firebaseAuthedResidentProcedure
    .input(z.object({ pseudonymizedId: z.string() }))
    .use(residentRestrictedMiddleware)
    .query(async ({ ctx, input }) => {
      if (ctx.userProfile.permissions?.includes("all_resident_flags_enabled")) {
        return typedFromEntries(
          Object.values(ResidentFlagId).map((id) => [id, true]),
        );
      }

      const rows = await ctx.prisma.residentFlagInstance.findMany({
        where: {
          pseudonymizedId: input.pseudonymizedId,
          effectiveAt: { lte: new Date() },
        },
        select: { flagId: true },
      });
      return typedFromEntries(rows.map((r) => [r.flagId, true]));
    }),
});
