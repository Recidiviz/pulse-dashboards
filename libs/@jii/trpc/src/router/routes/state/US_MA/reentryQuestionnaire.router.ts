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

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { reentryQuestionnaireAnswersSchema } from "~@jii/configs";

import {
  getReentryQuestionnaireInputSchema,
  getReentryQuestionnaireQueryResolver,
} from "../../../../helpers/US_MA/reentryQuestionnaire";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { router } from "../../../../procedures/init";
import { restrictedResidentProcedureForState } from "../restrictedResidentProcedureForState";

const usMaProcedure = restrictedResidentProcedureForState("US_MA");

export const usMaRouter = router({
  /**
   * Return the latest Reentry Questionnaire corresponding to the provided
   * resident, or null if none was found.
   */
  getReentryQuestionnaire: usMaProcedure
    .input(getReentryQuestionnaireInputSchema)
    .use(residentRestrictedMiddleware)
    .query(getReentryQuestionnaireQueryResolver),

  /**
   * Return the resident's latest Reentry Questionnaire, creating a new blank
   * one if none exists yet.
   */
  getOrCreateReentryQuestionnaire: usMaProcedure
    .input(getReentryQuestionnaireInputSchema)
    .use(residentRestrictedMiddleware)
    .mutation(async (queryArgs) => {
      const existing = await getReentryQuestionnaireQueryResolver(queryArgs);
      if (existing) {
        return existing;
      }

      const { pseudonymizedId } = queryArgs.input;
      return queryArgs.ctx.prisma.usMaReentryQuestionnaire.create({
        data: {
          pseudonymizedId,
          answers: {},
        },
      });
    }),

  /**
   * Update the Reentry Questionnaire identified by the given ID with the
   * provided answers.
   *
   * Raises an error if there is a mismatch between the resident's pseudonymized
   * ID and the pseudonymized ID associated with this Reentry Questionnaire.
   *
   * This will fully overwrite the user's answers stored in the db with whatever
   * is provided; it's the requester's responsibility to correctly join the
   * user's new answer with their existing answers.
   */
  overwriteReentryQuestionnaireAnswers: usMaProcedure
    .input(
      z.object({
        id: z.string(),
        pseudonymizedId: z.string(),
        answers: reentryQuestionnaireAnswersSchema,
        isCompleted: z.boolean(),
      }),
    )
    .use(residentRestrictedMiddleware)
    .mutation(async ({ ctx, input }) => {
      const reentryQuestionnaire =
        await ctx.prisma.usMaReentryQuestionnaire.findFirst({
          where: {
            id: input.id,
            pseudonymizedId: input.pseudonymizedId,
          },
        });
      if (!reentryQuestionnaire) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Reentry Questionnaire with ID ${input.id} not found`,
        });
      }

      return ctx.prisma.usMaReentryQuestionnaire.update({
        where: {
          id: input.id,
          pseudonymizedId: input.pseudonymizedId,
        },
        data: {
          answers: input.answers,
          completedAt: input.isCompleted ? new Date().toISOString() : undefined,
        },
      });
    }),
});
