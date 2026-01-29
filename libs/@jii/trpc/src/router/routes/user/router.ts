// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { firebaseAuthedResidentProcedure } from "../../../procedures/firebaseAuthedResidentProcedure";
import { router } from "../../../procedures/init";
import { setPropertiesInputSchema } from "./schema";

/**
 * Contains procedures that act on the user's own data. Its scope should be restricted
 * to data that is truly indexed by user (e.g. user preferences), as opposed to data that
 * is more properly indexed to a particular domain object (e.g. resident input that needs to be
 * made accessible to staff members)
 */
export const userRouter = router({
  getProperties: firebaseAuthedResidentProcedure.query(
    async ({ ctx: { prisma, userId } }) => {
      return prisma.userProperties.findUnique({
        where: { id: userId },
        omit: { id: true },
      });
    },
  ),
  setProperties: firebaseAuthedResidentProcedure
    .input(setPropertiesInputSchema)
    .mutation(async ({ input, ctx: { prisma, userId } }) => {
      return prisma.userProperties.upsert({
        where: { id: userId },
        update: { ...input },
        create: { id: userId, ...input },
      });
    }),
});
