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

import {
  rnaCheckboxAnswersSchema,
  rnaLifeAreaAnswersSchema,
  rnaTextAnswersSchema,
} from "~@jii/configs";
import { Prisma } from "~@jii/prisma";

import { router } from "../../../../procedures/init";
import { restrictedProcedureForState } from "../restrictedProcedureForState";
import { getRNAInputSchema, updateRNASchema } from "./rna.schema";

const ncProcedure = restrictedProcedureForState("US_NC");

export const usNcRouter = router({
  // Given a resident's pseudonymized ID, return the latest RNA object
  // corresponding to that resident, or null if none was found
  getRNA: ncProcedure
    .input(getRNAInputSchema)
    .query(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
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
    }),

  // Idempotently try to create a new RNA for this resident. More specifically,
  // - if the resident does not have an RNA or the latest RNA is completed,
  //   creates a new RNA with empty answers
  // - otherwise, if the latest RNA exists and is not completed,
  //   wipes away the answers of the most recent RNA to be empty
  createRNA: ncProcedure
    .input(getRNAInputSchema)
    .mutation(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
      const existingRNA = await prisma.usNcRNA.findFirst({
        where: {
          pseudonymizedId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      let result;
      // todo: edit this condition once we can use the date of RNA enablement
      // to determine whether to make a new RNA object or not.
      if (existingRNA && !existingRNA.completed) {
        result = existingRNA;
      } else {
        result = await prisma.usNcRNA.create({
          data: {
            pseudonymizedId,
            answers: {},
          },
        });
      }
      return {
        ...result,
        textAnswers: rnaTextAnswersSchema.parse(result.answers),
        checkboxAnswers: rnaCheckboxAnswersSchema.parse(result.answers),
        lifeAreaAnswers: rnaLifeAreaAnswersSchema.parse(result.answers),
      };
    }),

  // Update the RNA that has the given RNA id with the provided answers.
  // This will fully overwrite the user's answers stored in the db with whatever
  // is provided; it's the requester's responsibility to correctly join the user's
  // existing answers with existing db info.
  updateRNA: ncProcedure
    .input(updateRNASchema)
    .mutation(async ({ input, ctx: { prisma } }) => {
      try {
        return prisma.usNcRNA.update({
          where: { id: input.id },
          data: input,
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
    }),
});
