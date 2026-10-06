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

import { reentryQuestionnaireAnswersWriteSchema } from "~@jii/configs";

import {
  getReentryQuestionnaireInputSchema,
  getReentryQuestionnaireQueryResolver,
  withParsedAnswers,
} from "../../../../helpers/US_MA/reentryQuestionnaire";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { usMaProcedure } from "./usMaProcedure";

/**
 * Return the latest Reentry Questionnaire corresponding to the provided
 * resident, or null if none was found.
 */
export const getReentryQuestionnaire = usMaProcedure
  .input(getReentryQuestionnaireInputSchema)
  .use(residentRestrictedMiddleware)
  .query(getReentryQuestionnaireQueryResolver);

/**
 * Overwrites the answers on the resident's latest Reentry Questionnaire,
 * creating it first if they don't have one yet.
 *
 * This will fully overwrite the user's answers stored in the db with whatever
 * is provided; it's the requester's responsibility to correctly join the
 * user's new answer with their existing answers.
 */
export const upsertReentryQuestionnaireAnswers = usMaProcedure
  .input(
    z.object({
      pseudonymizedId: z.string(),
      answers: reentryQuestionnaireAnswersWriteSchema,
      isCompleted: z.boolean(),
    }),
  )
  .use(residentRestrictedMiddleware)
  .mutation(async ({ ctx, input }) => {
    const data = {
      answers: input.answers,
      completedAt: input.isCompleted ? new Date().toISOString() : undefined,
    };
    const latest = await ctx.prisma.usMaReentryQuestionnaire.findFirst({
      where: { pseudonymizedId: input.pseudonymizedId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const saved = latest
      ? await ctx.prisma.usMaReentryQuestionnaire.update({
          where: { id: latest.id },
          data,
        })
      : await ctx.prisma.usMaReentryQuestionnaire.create({
          data: { pseudonymizedId: input.pseudonymizedId, ...data },
        });
    return withParsedAnswers(saved);
  });
