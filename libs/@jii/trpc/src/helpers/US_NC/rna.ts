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

import { isAfter, subDays } from "date-fns";
import { z } from "zod";

import {
  rnaCheckboxAnswersSchema,
  rnaLifeAreaAnswersSchema,
  rnaTextAnswersSchema,
} from "~@jii/configs";
import { Prisma, PrismaClient } from "~@jii/prisma";

export const getRNAInputSchema = z.object({
  pseudonymizedId: z.string(),
}) satisfies z.ZodType<Prisma.UsNcRNAWhereInput>;

/**
 * Given a resident's pseudonymized ID, return the latest RNA object
 * corresponding to that resident, or null if none was found
 */
export const getRNAQueryResolver = async ({
  input: { pseudonymizedId },
  ctx: { prisma },
}: {
  input: z.infer<typeof getRNAInputSchema>;
  ctx: { prisma: PrismaClient };
}) => {
  const result = await prisma.usNcRNA.findFirst({
    where: {
      pseudonymizedId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!result) {
    return;
  }

  return {
    ...result,
    textAnswers: rnaTextAnswersSchema.parse(result.answers),
    checkboxAnswers: rnaCheckboxAnswersSchema.parse(result.answers),
    lifeAreaAnswers: rnaLifeAreaAnswersSchema.parse(result.answers),
  };
};

// Within the returned window, older assessments are considered stale.
export function getRNAWindow(rnaDueDate: Date): {
  rnaWindowStart: Date;
  isWithinRNAWindow: boolean;
} {
  const rnaWindowStart = subDays(rnaDueDate, 90);
  return {
    rnaWindowStart,
    isWithinRNAWindow: isAfter(new Date(), rnaWindowStart),
  };
}

/**
 * Return the provided RNA results if they are considered current
 * (i.e. can be viewed in the tablet app or staff app), or undefined
 * if the self-report doesn't exist.
 *
 * An RNA starts being considered stale if the date 90 days before the
 * person's RNA due date has passed.
 */
export function validateCurrentRNA<T extends { createdAt: Date }>(
  rnaDueDate: Date,
  latestRNA?: T,
) {
  if (!latestRNA) return undefined;

  // within this window, older assessments are considered stale
  const { rnaWindowStart, isWithinRNAWindow } = getRNAWindow(rnaDueDate);

  if (isWithinRNAWindow) {
    if (isAfter(latestRNA.createdAt, rnaWindowStart)) {
      // the latest RNA is fresh
      return latestRNA;
    }
    // the latest RNA is stale
    return undefined;
  }
  // we don't care about freshness here
  return latestRNA;
}
