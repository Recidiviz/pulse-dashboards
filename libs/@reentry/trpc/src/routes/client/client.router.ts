// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { getChatHistoryForClient } from "~@reentry/intake-agent/utils";
import { regularJwtProcedure, router } from "~@reentry/trpc/init";
import {
  getAddressInputSchema,
  updateAddressInputSchema,
} from "~@reentry/trpc/routes/client/client.schema";
import { CLIENT_GET_ARGS } from "~@reentry/trpc/routes/client/constants";
import {
  parseAddress,
  startAssessmentAndActionPlanGeneration,
} from "~@reentry/trpc/routes/intake-chat/utils";

export const clientRouter = router({
  getAddress: regularJwtProcedure
    .input(getAddressInputSchema)
    .query(async ({ ctx: { prisma }, input: { clientPseudoId } }) => {
      const client = await prisma.client.findUnique({
        where: {
          pseudonymizedId: clientPseudoId,
        },
        select: CLIENT_GET_ARGS,
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No client found with ID "${clientPseudoId}"`,
        });
      }

      if (!client.address) {
        return null;
      }

      return client.address;
    }),
  updateAddressStartAssessment: regularJwtProcedure
    .input(updateAddressInputSchema)
    .mutation(
      async ({
        ctx: { prisma, stateCode, req },
        input: { clientPseudoId, address, intakeId },
      }) => {
        const client = await prisma.client.findUnique({
          where: {
            pseudonymizedId: clientPseudoId,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No client found with ID "${clientPseudoId}"`,
          });
        }

        if (!intakeId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Intake ID is required to start assessment",
          });
        }

        await prisma.client.update({
          where: {
            pseudonymizedId: client.pseudonymizedId,
          },
          data: {
            address,
          },
        });

        const parsedAddress = parseAddress(address);

        // Kick off assessment and action plan generation based on chat history
        const { messages } = await getChatHistoryForClient(intakeId, stateCode);

        let assessmentResponse;
        if (messages && messages.length > 0) {
          assessmentResponse = await startAssessmentAndActionPlanGeneration(
            req,
            messages,
            parsedAddress,
          );
        }

        return {
          intakeId: intakeId,
          address: parsedAddress,
          assessmentResponse:
            assessmentResponse ?? "No chat history found for this intake.",
        };
      },
    ),
});
