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
  ApplicationSubStage,
  MessageSenderType,
  type Prisma,
  type PrismaClient,
  ThreadStatus,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  computeStaffSubStageAfterStaffInfoReply,
  STAFF_INFO_REPLY_PROVIDER_UPDATE,
  STAFF_INFO_REPLY_STAFF_STATUS,
} from "~@idaho-th/trpc/routes/housing-common/applicationProgression";
import {
  HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  lockHousingApplicationForUpdate,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";

import {
  findProviderInfoEdit,
  findStaffInfoReply,
  findStaffInfoRequest,
  getStaffOpenInfoRequest,
  loadProviderInfoRequest,
  requireProviderInfoEdit,
  requireStaffInfoReply,
  resolveStaffInfoRequest,
} from "./infoRequest.helpers";
import {
  INFO_REQUEST_MESSAGES_SELECT,
  INFO_REQUEST_THREAD_WHERE,
} from "./infoRequest.selects";
import type { ResolvedProviderInfoEdit } from "./infoRequest.types";

type TransactionClient = Prisma.TransactionClient;

async function persistStaffInfoReply(
  tx: TransactionClient,
  reply: {
    applicationId: string;
    providerApplicationId: string;
    infoRequestId: string;
    providerApplications: Array<{ id: string; subStage: ApplicationSubStage }>;
  },
  staffPseudonymizedId: string,
  message: string,
) {
  const staffSubStage = computeStaffSubStageAfterStaffInfoReply(
    reply.providerApplications,
    reply.providerApplicationId,
  );
  const resolvedAt = new Date();

  const updatedApplication = await tx.housingApplication.update({
    where: { id: reply.applicationId },
    data: {
      // lastActivityAt is the canonical "Last Updated" dashboard timestamp.
      lastActivityAt: resolvedAt,
      staffApplication: {
        update: {
          subStage: staffSubStage,
          status: STAFF_INFO_REPLY_STAFF_STATUS,
        },
      },
      providerApplications: {
        update: {
          where: { id: reply.providerApplicationId },
          data: {
            ...STAFF_INFO_REPLY_PROVIDER_UPDATE,
            threads: {
              update: {
                where: {
                  id: reply.infoRequestId,
                  ...INFO_REQUEST_THREAD_WHERE,
                },
                data: {
                  status: ThreadStatus.CLOSED,
                  resolvedAt,
                  messages: {
                    create: {
                      senderType: MessageSenderType.STAFF,
                      senderPseudonymizedId: staffPseudonymizedId,
                      body: message,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    select: {
      providerApplications: {
        where: { id: reply.providerApplicationId },
        select: {
          threads: {
            where: { id: reply.infoRequestId, ...INFO_REQUEST_THREAD_WHERE },
            select: {
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: INFO_REQUEST_MESSAGES_SELECT,
              },
            },
          },
        },
      },
    },
  });

  const createdMessage =
    updatedApplication.providerApplications[0]?.threads[0]?.messages[0];
  if (createdMessage == null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to persist staff info reply",
    });
  }

  return {
    message: createdMessage,
    staffSubStage,
    staffStatus: STAFF_INFO_REPLY_STAFF_STATUS,
  };
}

async function persistProviderInfoRequestMessageEdit(
  tx: TransactionClient,
  edit: ResolvedProviderInfoEdit,
  message: string,
) {
  const updatedApplication = await tx.housingApplication.update({
    where: { id: edit.applicationId },
    data: {
      // lastActivityAt is the canonical "Last Updated" dashboard timestamp.
      lastActivityAt: new Date(),
      providerApplications: {
        update: {
          where: { id: edit.providerApplicationId },
          data: {
            threads: {
              update: {
                where: { id: edit.infoRequestId, ...INFO_REQUEST_THREAD_WHERE },
                data: {
                  messages: {
                    update: {
                      where: { id: edit.editableMessage.id },
                      data: {
                        body: message,
                        originalBody:
                          edit.editableMessage.originalBody ??
                          edit.editableMessage.body,
                        editedAt: new Date(),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    select: {
      providerApplications: {
        where: { id: edit.providerApplicationId },
        select: {
          threads: {
            where: { id: edit.infoRequestId, ...INFO_REQUEST_THREAD_WHERE },
            select: {
              messages: {
                where: { id: edit.editableMessage.id },
                select: INFO_REQUEST_MESSAGES_SELECT,
              },
            },
          },
        },
      },
    },
  });

  const updatedMessage =
    updatedApplication.providerApplications[0]?.threads[0]?.messages[0];
  if (updatedMessage == null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to persist provider info request message edit",
    });
  }

  return updatedMessage;
}

/**
 * Scoped to the active organization, so a colleague can correct an unread
 * message another colleague opened — one organization, one answer.
 */
export async function editProviderInfoRequestMessage(
  prisma: PrismaClient,
  activeProviderId: string,
  applicationId: string,
  message: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockHousingApplicationForUpdate(tx, applicationId);

    const edit = requireProviderInfoEdit(
      await findProviderInfoEdit(tx, applicationId, activeProviderId),
    );

    const updatedMessage = await persistProviderInfoRequestMessageEdit(
      tx,
      edit,
      message,
    );

    return {
      applicationId,
      infoRequestId: edit.infoRequestId,
      message: updatedMessage,
    };
  }, HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS);
}

export async function postStaffInfoReply(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
  providerApplicationId: string,
  message: string,
) {
  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const reply = requireStaffInfoReply(
        await findStaffInfoReply(tx, applicationId, providerApplicationId),
        staffPseudonymizedId,
        providerApplicationId,
      );

      const { message: createdMessage, ...workflowState } =
        await persistStaffInfoReply(tx, reply, staffPseudonymizedId, message);

      await recordTimelineEvent(tx, {
        applicationId,
        actor: {
          role: TimelineActorRole.STAFF,
          pseudonymizedId: staffPseudonymizedId,
        },
        scopedProviderId: reply.providerId,
        type: TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST,
        providerName: reply.providerName,
        infoRequestId: reply.infoRequestId,
        infoRequestMessageId: createdMessage.id,
      });

      return {
        applicationId,
        providerApplicationId,
        infoRequestId: reply.infoRequestId,
        message: createdMessage,
        ...workflowState,
      };
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

export async function markStaffInfoMessagesRead(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
  providerApplicationId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockHousingApplicationForUpdate(tx, applicationId);

    const { infoRequestId } = await getStaffOpenInfoRequest(
      tx,
      applicationId,
      staffPseudonymizedId,
      providerApplicationId,
    );

    const readAt = new Date();

    const { count } = await tx.threadMessage.updateMany({
      where: {
        threadId: infoRequestId,
        thread: INFO_REQUEST_THREAD_WHERE,
        senderType: MessageSenderType.PROVIDER,
        readAt: null,
      },
      data: { readAt },
    });

    return {
      applicationId,
      providerApplicationId,
      infoRequestId,
      markedReadCount: count,
      readAt,
    };
  }, HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS);
}

/** Scoped to the active organization: colleagues read one shared thread. */
export async function getProviderInfoRequest(
  prisma: PrismaClient,
  activeProviderId: string,
  applicationId: string,
) {
  return loadProviderInfoRequest(prisma, applicationId, activeProviderId);
}

export async function getStaffInfoRequest(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
  providerApplicationId: string,
) {
  const context = await findStaffInfoRequest(
    prisma,
    applicationId,
    providerApplicationId,
  );

  return resolveStaffInfoRequest(context, staffPseudonymizedId);
}
