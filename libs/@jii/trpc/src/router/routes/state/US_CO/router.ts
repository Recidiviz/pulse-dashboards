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

import { residentRestrictedMiddleware } from "../../../../middleware/residentRestrictedMiddleware";
import { router } from "../../../../procedures/init";
import { restrictedResidentProcedureForState } from "../restrictedResidentProcedureForState";
import { cachedFetchPrograms } from "./fetchPrograms";
import { getProgramsInputSchema, setStarredProgramInputSchema } from "./schema";

const coloradoProcedure = restrictedResidentProcedureForState("US_CO");

export const usCoRouter = router({
  getPrograms: coloradoProcedure
    .input(getProgramsInputSchema)
    .use(residentRestrictedMiddleware)
    .query(async ({ ctx, input }) => {
      const [programs, starredPrograms] = await Promise.all([
        cachedFetchPrograms(),
        ctx.prisma.usCoStarredProgram.findMany({
          where: {
            pseudonymizedId: input.pseudonymizedId,
          },
        }),
      ]);

      // Create a Set for efficient lookup
      const starredKeys = new Set(
        starredPrograms.map((p) => `${p.programId}:${p.title}`),
      );

      // Add isStarred field to each program
      return programs.map((program) => ({
        ...program,
        isStarred: starredKeys.has(`${program.programId}:${program.title}`),
      }));
    }),

  setStarredProgram: coloradoProcedure
    .input(setStarredProgramInputSchema)
    .use(residentRestrictedMiddleware)
    .mutation(async ({ ctx, input }) => {
      const { pseudonymizedId, programId, title, isStarred } = input;

      if (isStarred) {
        // Add starred program. We use upsert here in case the frontend
        // is out of sync with the backend: if the user tries to add a
        // star that already exists, that's fine.
        await ctx.prisma.usCoStarredProgram.upsert({
          where: {
            pseudonymizedId_programId_title: {
              pseudonymizedId,
              programId,
              title,
            },
          },
          update: {},
          create: {
            pseudonymizedId,
            programId,
            title,
          },
        });
      } else {
        // deleteMany behaves like the upsert version of delete:
        // It'll delete the row if it exists, but it won't complain
        // if it's already been deleted.
        await ctx.prisma.usCoStarredProgram.deleteMany({
          where: {
            pseudonymizedId,
            programId,
            title,
          },
        });
      }

      return { success: true };
    }),
});
