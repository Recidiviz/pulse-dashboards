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

import { Prisma } from "~@jii/prisma";

import {
  getRNAQueryResolver,
  validateCurrentRNA,
} from "../../../../helpers/US_NC/rna";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { router } from "../../../../procedures/init";
import { restrictedResidentProcedureForState } from "../restrictedResidentProcedureForState";
import { updateRNASchema } from "./rna.schema";

const ncProcedure = restrictedResidentProcedureForState("US_NC");

const residentGetRNAInputSchema = z.object({
  pseudonymizedId: z.string(),
  rnaDueDate: z.date(),
}) satisfies z.ZodType<Prisma.UsNcRNAWhereInput>;

const residentCreateRNAInputSchema = z.object({
  pseudonymizedId: z.string(),
}) satisfies z.ZodType<Prisma.UsNcRNAWhereInput>;

export const usNcRouter = router({
  // Get the current RNA for the person with provided pseudonymized ID
  getRNA: ncProcedure
    .input(residentGetRNAInputSchema)
    .use(residentRestrictedMiddleware)
    .query(async (queryArgs) => {
      const latestRNA = await getRNAQueryResolver(queryArgs);
      return validateCurrentRNA(queryArgs.input.rnaDueDate, latestRNA);
    }),

  // Create a new RNA for the person with provided pseudonymized ID
  createRNA: ncProcedure
    .input(residentCreateRNAInputSchema)
    .use(residentRestrictedMiddleware)
    .mutation(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
      const result = await prisma.usNcRNA.create({
        data: {
          pseudonymizedId,
          answers: {},
        },
      });

      return {
        ...result,
        textAnswers: {},
        checkboxAnswers: {},
        lifeAreaAnswers: {},
      };
    }),

  // Update the RNA that has the given RNA id with the provided answers.
  // This will fully overwrite the user's answers stored in the db with whatever
  // is provided; it's the requester's responsibility to correctly join the user's
  // existing answers with existing db info.
  updateRNA: ncProcedure
    .input(updateRNASchema)
    .use(residentRestrictedMiddleware)
    .mutation(
      async ({ input: { id, answers, completed }, ctx: { prisma } }) => {
        try {
          return prisma.usNcRNA.update({
            where: { id: id },
            data: {
              answers,
              completedAt: completed ? new Date() : undefined,
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Trying to update RNA with invalid id",
              cause: e,
            });
          }

          throw e;
        }
      },
    ),
});
