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
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  MessageSenderType,
  PrismaClient,
  ThreadStatus,
  ThreadType,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  PROVIDER_RESPONSE_STATUS_MESSAGE,
  PROVIDER_RESPONSE_TYPE,
  type ProviderResponseType,
} from "~@idaho-th/shared";
import {
  computeStaffStatusAfterProviderUpdate,
  computeStaffSubStageAfterProviderUpdate,
  isHomePlanRevoke,
  PROVIDER_RESPONSE_TRANSITIONS,
  type ResolvedProviderApplicationForResponse,
} from "~@idaho-th/trpc/routes/housing-common/applicationProgression";
import {
  HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  lockHousingApplicationForUpdate,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";
import type { RecordTimelineEventArgs } from "~@idaho-th/trpc/routes/timeline/timeline.types";
import { generateUuid } from "~@idaho-th/trpc/utils/common";

import {
  findProviderResponseApplication,
  requireProviderResponseSubmission,
  requireResponseMessage,
} from "./providerResponse.helpers";
import {
  type ProviderResponseSideEffectResult,
  type ProviderResponseState,
  type ProviderResponseSubmitResult,
  type ProviderResponseTransactionClient,
} from "./providerResponse.types";

/** Responses that open a thread whose first message is the provider's text. */
const THREAD_TYPE_BY_RESPONSE: Partial<
  Record<ProviderResponseType, ThreadType>
> = {
  [PROVIDER_RESPONSE_TYPE.INFO_NEEDED]: ThreadType.INFO_REQUEST,
  [PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL]:
    ThreadType.CONDITIONAL_APPROVAL_REVOKED,
};

function computeProviderResponseState(
  providerApp: ResolvedProviderApplicationForResponse,
  response: ProviderResponseType,
): ProviderResponseState {
  if (isHomePlanRevoke(providerApp, response)) {
    return {
      staffSubStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      staffStatus: ApplicationStatus.ACTION_NEEDED,
    };
  }

  const transition = PROVIDER_RESPONSE_TRANSITIONS[response];
  const staffSubStage = computeStaffSubStageAfterProviderUpdate(
    providerApp.application.providerApplications,
    providerApp.id,
    transition.providerUpdate.subStage,
  );

  return {
    staffSubStage,
    staffStatus: computeStaffStatusAfterProviderUpdate(
      providerApp.application.staffApplication.status,
      staffSubStage,
      response,
    ),
  };
}

/**
 * The message and pre-generated thread id for a response that opens a thread.
 * The id is generated here, not read back after the write, so the timeline
 * event can reference the thread before the case is closed.
 */
function buildProviderResponseSideEffects(
  response: ProviderResponseType,
  message?: string,
): ProviderResponseSideEffectResult {
  if (THREAD_TYPE_BY_RESPONSE[response] == null) {
    return {};
  }
  return { message: requireResponseMessage(message), threadId: generateUuid() };
}

function closeOpenThreads(types: ThreadType[], keepThreadId?: string) {
  return {
    updateMany: {
      where: {
        type: { in: types },
        status: ThreadStatus.OPEN,
        ...(keepThreadId != null ? { id: { not: keepThreadId } } : {}),
      },
      data: { status: ThreadStatus.CLOSED, resolvedAt: new Date() },
    },
  };
}

// Revoke threads stay OPEN while the revoke is the provider's current
// decision, and close the moment they pick any other response.
function buildThreadWrites(
  response: ProviderResponseType,
  sideEffects: ProviderResponseSideEffectResult,
  providerPseudonymizedId: string,
) {
  const threadType = THREAD_TYPE_BY_RESPONSE[response];
  if (threadType == null) {
    return closeOpenThreads([
      ThreadType.INFO_REQUEST,
      ThreadType.CONDITIONAL_APPROVAL_REVOKED,
    ]);
  }

  return {
    create: {
      id: sideEffects.threadId,
      type: threadType,
      status: ThreadStatus.OPEN,
      messages: {
        create: {
          senderType: MessageSenderType.PROVIDER,
          senderPseudonymizedId: providerPseudonymizedId,
          body: sideEffects.message ?? "",
        },
      },
    },
    // Prisma runs the nested create before updateMany, so the new thread
    // must be excluded or it is closed in the same write.
    ...closeOpenThreads(
      [ThreadType.CONDITIONAL_APPROVAL_REVOKED],
      sideEffects.threadId,
    ),
  };
}

function buildProviderResponseUpdateInput(
  providerApp: ResolvedProviderApplicationForResponse,
  response: ProviderResponseType,
  state: ProviderResponseState,
  sideEffects: ProviderResponseSideEffectResult,
  providerPseudonymizedId: string,
) {
  const homePlanRevoke = isHomePlanRevoke(providerApp, response);
  const { providerUpdate } = PROVIDER_RESPONSE_TRANSITIONS[response];

  return {
    where: { id: providerApp.application.id },
    data: {
      // lastActivityAt is the canonical "Last Updated" dashboard timestamp.
      lastActivityAt: new Date(),
      staffApplication: {
        update: {
          ...(homePlanRevoke ? { stage: ApplicationStage.CLOSED } : {}),
          subStage: state.staffSubStage,
          status: state.staffStatus,
        },
      },
      providerApplications: {
        update: {
          where: { id: providerApp.id },
          data: {
            ...providerUpdate,
            ...(homePlanRevoke ? { stage: ApplicationStage.CLOSED } : {}),
            threads: buildThreadWrites(
              response,
              sideEffects,
              providerPseudonymizedId,
            ),
          },
        },
      },
    },
  };
}

type RecordProviderResponseTimelineEventArgs = {
  applicationId: string;
  providerPseudonymizedId: string;
  providerId: string;
  providerName: string;
  response: ProviderResponseType;
  sideEffects: ProviderResponseSideEffectResult;
  createdAt?: Date;
};

type ProviderResponseTimelineEventBase = {
  applicationId: string;
  createdAt?: Date;
  actor: {
    role: typeof TimelineActorRole.PROVIDER;
    pseudonymizedId: string;
  };
  scopedProviderId: string;
  providerName: string;
};

type ProviderResponseTimelineEventBuilder = (
  base: ProviderResponseTimelineEventBase,
  sideEffects: ProviderResponseSideEffectResult,
) => RecordTimelineEventArgs;

function requireThreadIdForTimelineEvent(
  sideEffects: ProviderResponseSideEffectResult,
): string {
  if (sideEffects.threadId == null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Missing thread id for timeline event",
    });
  }
  return sideEffects.threadId;
}

function providerNamedTimelineEvent(
  base: ProviderResponseTimelineEventBase,
  type:
    | typeof TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED
    | typeof TimelineEventType.PROVIDER_DECLINED,
): RecordTimelineEventArgs {
  return { ...base, type };
}

const PROVIDER_RESPONSE_TIMELINE_EVENT_BUILDERS: Record<
  ProviderResponseType,
  ProviderResponseTimelineEventBuilder
> = {
  [PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE]: (base) =>
    providerNamedTimelineEvent(
      base,
      TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED,
    ),
  [PROVIDER_RESPONSE_TYPE.DECLINE]: (base) =>
    providerNamedTimelineEvent(base, TimelineEventType.PROVIDER_DECLINED),
  [PROVIDER_RESPONSE_TYPE.INFO_NEEDED]: (base, sideEffects) => ({
    ...base,
    type: TimelineEventType.PROVIDER_REQUESTED_INFO,
    infoRequestId: requireThreadIdForTimelineEvent(sideEffects),
  }),
  [PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL]: (
    base,
    sideEffects,
  ) => ({
    ...base,
    type: TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL,
    threadId: requireThreadIdForTimelineEvent(sideEffects),
  }),
};

function buildProviderResponseTimelineEventArgs({
  applicationId,
  providerPseudonymizedId,
  providerId,
  providerName,
  response,
  sideEffects,
  createdAt,
}: RecordProviderResponseTimelineEventArgs): RecordTimelineEventArgs {
  const base: ProviderResponseTimelineEventBase = {
    applicationId,
    createdAt,
    actor: {
      role: TimelineActorRole.PROVIDER,
      pseudonymizedId: providerPseudonymizedId,
    },
    scopedProviderId: providerId,
    providerName,
  };

  return PROVIDER_RESPONSE_TIMELINE_EVENT_BUILDERS[response](base, sideEffects);
}

async function recordProviderResponseTimelineEvent(
  tx: ProviderResponseTransactionClient,
  args: RecordProviderResponseTimelineEventArgs,
): Promise<void> {
  await recordTimelineEvent(tx, buildProviderResponseTimelineEventArgs(args));
}

function buildProviderResponseSubmitResult(
  applicationId: string,
  response: ProviderResponseType,
  state: ProviderResponseState,
  sideEffects: ProviderResponseSideEffectResult,
): ProviderResponseSubmitResult {
  return {
    applicationId,
    ...state,
    response,
    statusMessage: PROVIDER_RESPONSE_STATUS_MESSAGE[response],
    ...sideEffects,
  };
}

/** The caller of a provider response: the organization, and the person acting for it. */
export type ProviderResponseActor = {
  /** Verified active HousingProvider.id — what the match is resolved by. */
  providerId: string;
  /** The person, recorded as the author of the message and the timeline event. */
  providerPseudonymizedId: string;
};

export async function submitProviderApplicationResponse(
  prisma: PrismaClient,
  { providerId, providerPseudonymizedId }: ProviderResponseActor,
  applicationId: string,
  response: ProviderResponseType,
  message?: string,
) {
  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      // Both the lookup and the ownership check run on the verified
      // organization; the person's id is only ever recorded as authorship.
      const resolvedProviderApp = requireProviderResponseSubmission(
        await findProviderResponseApplication(tx, applicationId, providerId),
        providerId,
        response,
      );
      const state = computeProviderResponseState(resolvedProviderApp, response);
      const sideEffects = buildProviderResponseSideEffects(response, message);
      const homePlanRevoke = isHomePlanRevoke(resolvedProviderApp, response);

      // Recorded before the write: a home plan revoke closes the case, and a
      // closed case only accepts CASE_CLOSED. Explicit, strictly increasing
      // timestamps keep the two events in order instead of falling back to
      // the id tie-break.
      const respondedAt = new Date();
      await recordProviderResponseTimelineEvent(tx, {
        applicationId,
        providerPseudonymizedId,
        providerId: resolvedProviderApp.providerId,
        providerName: resolvedProviderApp.providerName,
        response,
        sideEffects,
        createdAt: homePlanRevoke ? respondedAt : undefined,
      });

      await tx.housingApplication.update(
        buildProviderResponseUpdateInput(
          resolvedProviderApp,
          response,
          state,
          sideEffects,
          providerPseudonymizedId,
        ),
      );

      if (homePlanRevoke) {
        await recordTimelineEvent(tx, {
          applicationId,
          actor: { role: TimelineActorRole.SYSTEM },
          type: TimelineEventType.CASE_CLOSED,
          closedSubStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
          createdAt: new Date(respondedAt.getTime() + 1),
        });
      }

      return buildProviderResponseSubmitResult(
        applicationId,
        response,
        state,
        sideEffects,
      );
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}
