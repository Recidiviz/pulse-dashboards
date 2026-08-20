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

import { differenceInDays } from "date-fns/esm";
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

/**
 * Given a resident's pseudonymized ID, return the resident's current seq number and
 * admit date (used to uniquely identify an OPUS-enabled RNA for the person, even
 * between different incarceration spans)
 */
export const getRNAWritebackDataQueryResolver = async ({
  input: { pseudonymizedId },
  ctx: { prisma },
}: {
  input: z.infer<typeof getRNAInputSchema>;
  ctx: { prisma: PrismaClient };
}) => {
  const result = await prisma.usNcRNAWritebackData.findFirst({
    where: { pseudonymizedId },
    // we don't expect multiple rows here, but return the latest one just in case
    orderBy: { importedAt: "desc" },
  });

  return { seqNumber: result?.seqNumber, admitDate: result?.admitDate };
};

/**
 * Logic shared between the staff and resident routes to determine whether a resident's
 * most recent RNA was stale.
 *
 * All RNAs with mismatching seq number and/or admit date to the resident's current
 * [seq number, admit date] are stale and should not be shown to residents or staff,
 * with one exception: we don't treat recent in-progress RNAs as stale if they were
 * updated within the last 60 days, to guard against accidental changes to seq
 * number or admit date.
 */
export const latestRNAIsStale = ({
  latestRNA,
  seqNumber,
  admitDate,
}: {
  latestRNA: Partial<Awaited<ReturnType<typeof getRNAQueryResolver>>>;
} & Awaited<ReturnType<typeof getRNAWritebackDataQueryResolver>>) => {
  const rnaIsStale =
    latestRNA?.seqNumber !== seqNumber ||
    latestRNA?.admitDate?.getTime() !== admitDate?.getTime();

  const rnaIsRecentAndInProgress =
    latestRNA?.updatedAt &&
    latestRNA.seqNumber &&
    !latestRNA.completedAt &&
    differenceInDays(new Date(), latestRNA.updatedAt) < 60;

  return rnaIsStale && !rnaIsRecentAndInProgress;
};
