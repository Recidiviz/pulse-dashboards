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

import { reentryQuestionnaireAnswersReadSchema } from "~@jii/configs";
import { Prisma, PrismaClient, UsMaReentryQuestionnaire } from "~@jii/prisma";

/**
 * Returns the questionnaire with its stored JSON answers parsed into typed answers.
 */
export const withParsedAnswers = (questionnaire: UsMaReentryQuestionnaire) => ({
  ...questionnaire,
  answers: reentryQuestionnaireAnswersReadSchema.parse(questionnaire.answers),
});

export const getReentryQuestionnaireInputSchema = z.object({
  pseudonymizedId: z.string(),
}) satisfies z.ZodType<Prisma.UsMaReentryQuestionnaireWhereInput>;

/**
 * Given a resident's pseudonymized ID, return their latest Reentry Questionnaire,
 * or null if none was found.
 */
export const getReentryQuestionnaireQueryResolver = async ({
  input: { pseudonymizedId },
  ctx: { prisma },
}: {
  input: z.infer<typeof getReentryQuestionnaireInputSchema>;
  ctx: { prisma: PrismaClient };
}) => {
  const questionnaire = await prisma.usMaReentryQuestionnaire.findFirst({
    where: {
      pseudonymizedId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  return questionnaire && withParsedAnswers(questionnaire);
};
