// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { baseProcedure, router } from "~@sentencing/trpc/init";
import { getSARInputSchema } from "~@sentencing/trpc/routes/sar/sar.schema";

export const sarRouter = router({
  getSAR: baseProcedure
    .input(getSARInputSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const sarData = await prisma.sentencingAssessmentReport.findUnique({
        where: {
          id,
        },
        omit: {
          staffId: true,
          clientId: true,
          createdAt: true,
          updatedAt: true,
        },
        include: {
          charges: {
            omit: {
              id: true,
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
            include: {
              offense: {
                select: {
                  name: true,
                },
              },
            },
          },
          drugHistories: {
            omit: {
              id: true,
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
          },
          client: {
            select: {
              fullName: true,
              gender: true,
              ssn: true,
              externalId: true,
              birthDate: true,
            },
          },
        },
      });

      if (!sarData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sentencing Assessment Report with that id was not found",
        });
      }

      // Flatten the response
      return {
        ...sarData,
        charges: sarData.charges.map((charge) => ({
          ...charge,
          offense: charge.offense?.name ?? null,
        })),
      };
    }),
});
