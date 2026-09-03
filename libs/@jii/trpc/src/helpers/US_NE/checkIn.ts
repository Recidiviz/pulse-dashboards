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

import { Prisma, PrismaClient } from "~@jii/prisma";

export const getCheckInInputSchema = z.object({
  pseudonymizedId: z.string(),
}) satisfies z.ZodType<Prisma.UsNeCheckInWhereInput>;

/**
 * Given a resident's pseudonymized ID, return the latest 120-Day Check-In object
 * corresponding to that resident, or null if none was found
 */
export const getCheckInQueryResolver = async ({
  input: { pseudonymizedId },
  ctx: { prisma },
}: {
  input: z.infer<typeof getCheckInInputSchema>;
  ctx: { prisma: PrismaClient };
}) => {
  const result = await prisma.usNeCheckIn.findFirst({
    where: {
      pseudonymizedId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!result) {
    return null;
  }

  // TODO(OBT-47841): parse with zod
  return result;
};
