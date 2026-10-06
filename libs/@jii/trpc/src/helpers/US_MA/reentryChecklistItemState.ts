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
  ReentryChecklistItemId,
  ReentryQuestionnaireAnswers,
  reentryQuestionnaireAnswersReadSchema,
} from "~@jii/configs";
import { Prisma, PrismaClient } from "~@jii/prisma";

import { getApplicableReentryChecklistItems } from "./reentryChecklistApplicability";

export const getReentryChecklistItemStateInputSchema = z.object({
  pseudonymizedId: z.string(),
}) satisfies z.ZodType<Prisma.UsMaReentryChecklistItemStateWhereInput>;

/**
 * Given a resident's pseudonymized ID, return the answers from their latest
 * *submitted* Reentry Questionnaire (`completedAt` set), or `{}` if none
 * exists. Checklist applicability should only reflect a resident's final answers.
 */
async function getSubmittedReentryQuestionnaireAnswers(
  prisma: PrismaClient,
  pseudonymizedId: string,
): Promise<ReentryQuestionnaireAnswers> {
  const submitted = await prisma.usMaReentryQuestionnaire.findFirst({
    where: {
      pseudonymizedId,
      completedAt: { not: null },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!submitted) return {};
  return reentryQuestionnaireAnswersReadSchema.parse(submitted.answers);
}

/**
 * Ensures a `UsMaReentryChecklistItemState` row exists for every checklist item
 * currently applicable to this resident, based on their latest submitted
 * questionnaire answers.
 *
 * @returns the ids of every item currently applicable to this resident.
 */
async function ensureApplicableChecklistItemsExist(
  prisma: PrismaClient,
  pseudonymizedId: string,
): Promise<ReentryChecklistItemId[]> {
  const answers = await getSubmittedReentryQuestionnaireAnswers(
    prisma,
    pseudonymizedId,
  );
  const applicableItemIds = getApplicableReentryChecklistItems(answers);

  // For each applicable item, attempt to insert a row; skipDuplicates means a
  // row that already exists (for this pseudonymizedId + itemId) is silently
  // left untouched rather than erroring, so an already-checked item's state
  // is never reset by this call.
  await prisma.usMaReentryChecklistItemState.createMany({
    data: applicableItemIds.map((itemId) => ({ pseudonymizedId, itemId })),
    skipDuplicates: true,
  });

  return applicableItemIds;
}

/**
 * Ensures applicable checklist item rows exist, then returns the current
 * state of every currently-applicable item for this resident.
 */
export async function getReentryChecklistItemStateQueryResolver(
  prisma: PrismaClient,
  pseudonymizedId: string,
) {
  const applicableItemIds = await ensureApplicableChecklistItemsExist(
    prisma,
    pseudonymizedId,
  );

  return prisma.usMaReentryChecklistItemState.findMany({
    where: {
      pseudonymizedId,
      itemId: { in: applicableItemIds },
    },
  });
}
