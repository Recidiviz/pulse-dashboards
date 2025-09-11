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

import { Prisma } from "~@reentry/prisma/client";
import { auth0Procedure, router } from "~@reentry/trpc/init";
import {
  getAllClientsIntakeStatusInputSchema,
  getClientIntakeStatusSchema,
  getIntakeInputSchema,
  toggleIntakeInputSchema,
} from "~@reentry/trpc/routes/staff/staff.schema";
import * as staffUtils from "~@reentry/trpc/routes/staff/utils";

export const staffRouter = router({
  getClientIntakeStatus: auth0Procedure
    .input(getClientIntakeStatusSchema)
    .query(
      async ({
        ctx: { prisma, req },
        input: { staffPseudoId, clientPseudoId },
      }) => {
        try {
          const client = await prisma.client.findUniqueOrThrow({
            where: {
              pseudonymizedId: clientPseudoId,
            },
            select: {
              intakeEnabled: true,
              Intake: true,
            },
          });

          const processingStatus = await staffUtils.fetchProcessingStatus(
            req,
            staffPseudoId,
            clientPseudoId,
          );

          return staffUtils.resolveIntakeStatus(
            { ...client, pseudonymizedId: clientPseudoId },
            processingStatus,
          );
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Client not found",
            });
          }
          return;
        }
      },
    ),
  getAllClientsIntakeStatus: auth0Procedure
    .input(getAllClientsIntakeStatusInputSchema)
    .query(async ({ ctx: { prisma, req }, input: { staffPseudoId } }) => {
      const clients = await prisma.client.findMany({
        where: {
          staff: {
            some: {
              staff: {
                pseudonymizedId: staffPseudoId,
              },
            },
          },
        },
        include: {
          Intake: true,
        },
      });

      const clientToStatusMap: Record<string, string> = {};
      const processingStatusMap = await staffUtils.fetchProcessingStatus(
        req,
        staffPseudoId,
      );

      clients.forEach((client) => {
        clientToStatusMap[client.pseudonymizedId] =
          staffUtils.resolveIntakeStatus(client, processingStatusMap);
      });

      return clientToStatusMap;
    }),
  getIntakeEnabled: auth0Procedure
    .input(getIntakeInputSchema)
    .query(async ({ ctx: { prisma }, input: { clientPseudoId } }) => {
      try {
        const client = await prisma.client.findUniqueOrThrow({
          where: {
            pseudonymizedId: clientPseudoId,
          },
          select: {
            intakeEnabled: true,
          },
        });

        return { intakeEnabled: client.intakeEnabled };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        return { intakeEnabled: false };
      }
    }),
  toggleIntake: auth0Procedure
    .input(toggleIntakeInputSchema)
    .mutation(
      async ({ ctx: { prisma }, input: { clientPseudoId, enable } }) => {
        try {
          await prisma.client.update({
            where: {
              pseudonymizedId: clientPseudoId,
            },
            data: {
              intakeEnabled: enable,
            },
          });

          return { success: true };
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Client not found",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update intake status",
          });
        }
      },
    ),
});
