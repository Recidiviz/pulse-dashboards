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

import { rollup } from "d3-array";
import { z } from "zod";

import { router } from "../../../../../procedures/init";
import { stateRestrictedStaffProcedureFactory } from "../../../../../procedures/stateRestrictedStaffProcedureFactory";

const stateProcedure = stateRestrictedStaffProcedureFactory("US_NC");

export const usNcStaffRouter = router({
  rnaStatusList: stateProcedure
    .input(z.object({ pseudonymizedIds: z.array(z.string()) }))
    .query(async ({ ctx: { prisma }, input }) => {
      const allRecords = await prisma.usNcRNA.findMany({
        where: {
          pseudonymizedId: { in: input.pseudonymizedIds },
        },
        select: {
          pseudonymizedId: true,
          completed: true,
          updatedAt: true,
        },
        // we only want the most recent for each person,
        // this will help us filter for that in memory
        orderBy: {
          updatedAt: "desc",
        },
      });

      return [
        ...rollup(
          allRecords,
          // first item is most recent because the query sorted them
          (v) => v[0],
          // group by person
          (r) => r.pseudonymizedId,
        ).values(),
      ];
    }),
});
