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
