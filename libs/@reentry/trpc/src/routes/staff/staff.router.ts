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
import { Prisma } from "~@reentry/prisma/client";
import { auth0Procedure, router } from "~@reentry/trpc/init";
import {
  getAllClientsIntakeStatusInputSchema,
  getClientIntakeStatusSchema,
  getIntakeHistoryInputSchema,
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
  getIntakeHistory: auth0Procedure
    .input(getIntakeHistoryInputSchema)
    .query(
      async ({ ctx: { prisma, stateCode }, input: { clientPseudoId } }) => {
        // Fetch latest intake for this client (assuming last is current)
        const intake = await prisma.intake.findFirst({
          where: { client: { pseudonymizedId: clientPseudoId } },
          orderBy: { startDate: "desc" },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            config: true,
          },
        });

        if (!intake) {
          return null;
        }

        const { messages: chatHistory, currentSectionIndex } =
          await getChatHistoryForClient(intake.id, stateCode);
        if (currentSectionIndex === undefined) {
          // Debug guard: unexpected undefined active section index; defaulting to 0.
          // If this occurs frequently we should investigate intake agent checkpointing.
          console.warn(
            `[staff.getIntakeHistory] currentSectionIndex undefined for intake ${intake.id}; defaulting to 0`,
          );
        }
        const sections = intake.config?.sections || [];

        const idx = currentSectionIndex ?? 0;
        const completeAll = idx >= sections.length;
        const sectionsWithCompletionStatus = sections.map((section, i) => {
          let completion_status: string;
          if (completeAll || i < idx) {
            completion_status = "completed";
          } else if (i === idx) {
            completion_status = "in_progress";
          } else {
            completion_status = "not_started";
          }
          return {
            id: section.title,
            title: section.title,
            description: section.description,
            requiredInformation: section.requiredInformation,
            completion_status,
          };
        });

        return {
          intakeId: intake.id,
          startDate: intake.startDate,
          endDate: intake.endDate,
          sections: sectionsWithCompletionStatus,
          messages: (chatHistory || []).map((message) => ({
            id: message.id,
            content: message.content,
            section: message.response_metadata?.["section"],
            from_role: message.getType() === "ai" ? "case_worker" : "client",
          })),
        };
      },
    ),
});
