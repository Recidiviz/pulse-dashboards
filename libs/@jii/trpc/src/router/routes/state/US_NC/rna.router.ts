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

import { Prisma } from "~@jii/prisma";

import {
  getRNAInputSchema,
  getRNAQueryResolver,
  getRNAWritebackDataQueryResolver,
  latestRNAIsStale,
} from "../../../../helpers/US_NC/rna";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { router } from "../../../../procedures/init";
import { restrictedResidentProcedureForState } from "../restrictedResidentProcedureForState";
import { updateRNASchema } from "./rna.schema";

const ncProcedure = restrictedResidentProcedureForState("US_NC");

export const usNcRouter = router({
  getRNA: ncProcedure.input(getRNAInputSchema).query(getRNAQueryResolver),

  getOrCreateRNA: ncProcedure
    .input(getRNAInputSchema)
    .use(residentRestrictedMiddleware)
    .mutation(async (queryArgs) => {
      const latestRNA = await getRNAQueryResolver(queryArgs);

      const { seqNumber, admitDate } =
        await getRNAWritebackDataQueryResolver(queryArgs);

      // Create and return a new blank RNA if someone has a non-null seq number (meaning
      // the RNA has been enabled for them in OPUS) and either:
      // (1) they don't have an existing RNA, or
      // (2) their current writeback data doesn't match the existing RNA's writeback data
      //     (meaning the existing RNA is stale, and a new RNA has been enabled)
      //     However, don't create an RNA if the person's latest RNA was updated within
      //     the last 60 days, even if it's stale, to handle unexpected edge cases such
      //     as someone's admit date on record changing.
      if (seqNumber) {
        if (
          !latestRNA ||
          latestRNAIsStale({ latestRNA, seqNumber, admitDate })
        ) {
          const { pseudonymizedId } = queryArgs.input;
          const { prisma } = queryArgs.ctx;

          return {
            ...(await prisma.usNcRNA.create({
              data: {
                pseudonymizedId,
                answers: {},
                seqNumber,
                admitDate,
              },
            })),
            textAnswers: {},
            checkboxAnswers: {},
            lifeAreaAnswers: {},
          };
        }
      }

      // Edge case: if someone has a null seq number and their latest RNA is in progress,
      // either they started it before writeback was enabled, or they started the form
      // after writeback was enabled and their case manager disabled/closed it in OPUS;
      // don't return it.
      if (!seqNumber && latestRNA && !latestRNA.completedAt) {
        return null;
      }

      // Otherwise, return their existing RNA (which may be in progress or completed,
      // or not exist)
      return latestRNA;
    }),

  // Update the RNA that has the given RNA id with the provided answers.
  // This will fully overwrite the user's answers stored in the db with whatever
  // is provided; it's the requester's responsibility to correctly join the user's
  // existing answers with existing db info.
  updateRNA: ncProcedure
    .input(updateRNASchema)
    .use(residentRestrictedMiddleware)
    .mutation(
      async ({
        input: { pseudonymizedId, id, answers, completed },
        ctx: { prisma },
      }) => {
        try {
          // We generally expect the sequence number or admit date to NOT change between
          // subsequent updates of the same RNA row, since these fields are meant to
          // identify different instances of the form being administered to the same person.
          // However, just in case there is a change, make sure we're storing the most
          // recent data corresponding to this person.
          const { seqNumber, admitDate } =
            await getRNAWritebackDataQueryResolver({
              input: { pseudonymizedId },
              ctx: { prisma },
            });

          return prisma.usNcRNA.update({
            where: { id: id },
            data: {
              answers,
              completedAt: completed ? new Date() : undefined,
              seqNumber,
              admitDate,
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
