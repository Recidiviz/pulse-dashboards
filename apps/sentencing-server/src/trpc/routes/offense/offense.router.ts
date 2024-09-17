// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { baseProcedure, router } from "~sentencing-server/trpc/init";

export const offenseRouter = router({
  getOffenses: baseProcedure.query(async ({ ctx: { prisma } }) => {
    const offenses = await prisma.offense.findMany({
      select: {
        name: true,
      },
      where: {
        // TODO: Remove once we have insights for all offenses?
        // Only return offenses that have insights
        insightOffenses: {
          some: {},
        },
      },
    });

    return offenses.map((offense) => offense.name);
  }),
});
