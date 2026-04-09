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
} from "../../../../helpers/US_NC/rna";
import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { router } from "../../../../procedures/init";
import { restrictedResidentProcedureForState } from "../restrictedResidentProcedureForState";
import { updateRNASchema } from "./rna.schema";

const ncProcedure = restrictedResidentProcedureForState("US_NC");

export const usNcRouter = router({
  getRNA: ncProcedure.input(getRNAInputSchema).query(getRNAQueryResolver),

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
