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

import { PrismaClient } from "~@jii/prisma";

import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { router } from "../../../../procedures/init";
import { restrictedResidentProcedureForState } from "../restrictedResidentProcedureForState";

const nebraskaProcedure = restrictedResidentProcedureForState("US_NE");

async function getChecklistData(prisma: PrismaClient, pseudonymizedId: string) {
  const records = await prisma.usNeReentryChecklistQuestion.findMany({
    where: {
      pseudonymizedId,
    },
    orderBy: { updatedAt: "desc" },
  });

  const questions = Object.fromEntries(
    records.map((record) => [record.questionId, record.value]),
  );

  const lastUpdated = records.length === 0 ? undefined : records[0].updatedAt;

  return {
    questions,
    lastUpdated,
  };
}

const updateChecklistInputSchema = z.object({
  pseudonymizedId: z.string(),
  questions: z.record(z.string(), z.boolean()),
});

export type ReentryChecklistData = Awaited<ReturnType<typeof getChecklistData>>;

export const usNeRouter = router({
  getReentryChecklist: nebraskaProcedure
    .input(z.object({ pseudonymizedId: z.string() }))
    .use(residentRestrictedMiddleware)
    .query(async ({ ctx, input }) => {
      return getChecklistData(ctx.prisma, input.pseudonymizedId);
    }),

  updateReentryChecklist: nebraskaProcedure
    .input(updateChecklistInputSchema)
    .use(residentRestrictedMiddleware)
    .mutation(async ({ ctx, input }) => {
      const { pseudonymizedId, questions } = input;

      const updates = Object.entries(questions).map(([questionId, value]) =>
        ctx.prisma.usNeReentryChecklistQuestion.upsert({
          where: {
            pseudonymizedId_questionId: {
              pseudonymizedId,
              questionId,
            },
          },
          update: {
            value,
          },
          create: {
            pseudonymizedId,
            questionId,
            value,
          },
        }),
      );

      await ctx.prisma.$transaction(updates);

      return getChecklistData(ctx.prisma, pseudonymizedId);
    }),
});
