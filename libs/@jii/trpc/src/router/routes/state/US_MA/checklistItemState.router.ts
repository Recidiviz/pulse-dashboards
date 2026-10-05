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

import { reentryChecklistItemIds } from "~@jii/configs";
import { Prisma } from "~@jii/prisma";

import {
  getReentryChecklistItemStateInputSchema,
  getReentryChecklistItemStateQueryResolver,
} from "../../../../helpers/US_MA/reentryChecklistItemState";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { usMaProcedure } from "./usMaProcedure";

/**
 * Return the current state of every reentry checklist item currently
 * applicable to this resident (based on their latest submitted
 * questionnaire), creating rows for any newly-applicable item first. Meant to
 * be called on every mount of the checklist page, which also picks up items
 * that became applicable after a questionnaire submission.
 */
export const getReentryChecklistItemStates = usMaProcedure
  .input(getReentryChecklistItemStateInputSchema)
  .use(residentRestrictedMiddleware)
  .query(({ ctx, input }) =>
    getReentryChecklistItemStateQueryResolver(
      ctx.prisma,
      input.pseudonymizedId,
    ),
  );

/**
 * Updates the `checked` state of a single reentry checklist item for this
 * resident.
 */
export const updateReentryChecklistItemState = usMaProcedure
  .input(
    z.object({
      pseudonymizedId: z.string(),
      itemId: z.enum(reentryChecklistItemIds),
      checked: z.boolean(),
    }),
  )
  .use(residentRestrictedMiddleware)
  .mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.usMaReentryChecklistItemState.update({
        where: {
          pseudonymizedId_itemId: {
            pseudonymizedId: input.pseudonymizedId,
            itemId: input.itemId,
          },
        },
        data: {
          checked: input.checked,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Checklist item state not found for item ${input.itemId}`,
          cause: e,
        });
      }

      throw e;
    }
  });
