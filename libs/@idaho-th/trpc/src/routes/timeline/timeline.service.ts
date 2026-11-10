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
  MessageSenderType,
  type PrismaClient,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  findProviderClosedEventAt,
  resolveClosedProviderCutoff,
} from "~@idaho-th/trpc/routes/housing-common/providerVisibility";

import {
  findProviderTimelineApplication,
  findStaffTimelineApplication,
  isApplicationSentEventVisibleToProvider,
  isEventVisibleForCutoff,
  isEventVisibleToProvider,
  providerOwnsApplication,
  staffOwnsApplication,
  TIMELINE_APPLICATION_NOT_FOUND,
  touchProviderTimelineReadState,
  touchStaffTimelineReadState,
} from "./timeline.helpers";
import type {
  ProviderTimelineReader,
  ThreadMessageResolver,
  TimelineEventItem,
  TimelineEventRow,
  TimelineThreadRow,
  TimelineView,
} from "./timeline.types";

function applicationNotFound(): never {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: TIMELINE_APPLICATION_NOT_FOUND,
  });
}

function buildThreadMessageResolver(
  providerApplications: ReadonlyArray<TimelineThreadRow>,
): ThreadMessageResolver {
  const byMessageId = new Map<string, string>();
  const providerMessageByThreadId = new Map<string, string>();

  for (const providerApplication of providerApplications) {
    for (const thread of providerApplication.threads) {
      for (const message of thread.messages) {
        byMessageId.set(message.id, message.body);
      }
      const openingMessage = thread.messages.find(
        (message) => message.senderType === MessageSenderType.PROVIDER,
      );
      if (openingMessage) {
        providerMessageByThreadId.set(thread.id, openingMessage.body);
      }
    }
  }

  return { byMessageId, providerMessageByThreadId };
}

function resolveEventMessage(
  row: TimelineEventRow,
  resolver: ThreadMessageResolver,
): string | null {
  const metadata = row.metadata as Record<string, unknown> | null;

  if (row.eventType === TimelineEventType.PROVIDER_REQUESTED_INFO) {
    const infoRequestId = metadata?.["infoRequestId"];
    return typeof infoRequestId === "string"
      ? resolver.providerMessageByThreadId.get(infoRequestId) ?? null
      : null;
  }

  if (
    row.eventType === TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL
  ) {
    const threadId = metadata?.["threadId"];
    return typeof threadId === "string"
      ? resolver.providerMessageByThreadId.get(threadId) ?? null
      : null;
  }

  if (row.eventType === TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST) {
    const messageId = metadata?.["infoRequestMessageId"];
    return typeof messageId === "string"
      ? resolver.byMessageId.get(messageId) ?? null
      : null;
  }

  return null;
}

function mapEvent(
  row: TimelineEventRow,
  resolver: ThreadMessageResolver,
): TimelineEventItem {
  return {
    id: row.id,
    eventType: row.eventType,
    description: row.description,
    message: resolveEventMessage(row, resolver),
    actorRole: row.actorRole,
    createdAt: row.createdAt,
  };
}

function countNewEvents(
  events: ReadonlyArray<{ createdAt: Date }>,
  lastViewedAt: Date | null,
): number {
  if (lastViewedAt == null) {
    return events.length;
  }
  return events.filter((event) => event.createdAt > lastViewedAt).length;
}

export async function getStaffTimeline(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
  includeProviderNotSelected = false,
): Promise<TimelineView> {
  const application = await findStaffTimelineApplication(
    prisma,
    applicationId,
    staffPseudonymizedId,
    includeProviderNotSelected,
  );
  if (!application) {
    applicationNotFound();
  }

  const lastViewedTimelineAt =
    application.staffReadStates[0]?.lastViewedTimelineAt ?? null;

  const resolver = buildThreadMessageResolver(application.providerApplications);

  return {
    events: application.timelineEvents.map((event) =>
      mapEvent(event, resolver),
    ),
    newEventCount: countNewEvents(
      application.timelineEvents,
      lastViewedTimelineAt,
    ),
    lastViewedTimelineAt,
  };
}

export async function getProviderTimeline(
  prisma: PrismaClient,
  providerId: string,
  applicationId: string,
): Promise<TimelineView> {
  const application = await findProviderTimelineApplication(
    prisma,
    applicationId,
    providerId,
  );
  const providerApplication = application?.providerApplications[0];
  if (!application || !providerApplication) {
    applicationNotFound();
  }

  const cutoff = resolveClosedProviderCutoff(
    providerApplication.stage,
    findProviderClosedEventAt(application.timelineEvents, providerId),
  );
  const visibleEvents = application.timelineEvents.filter(
    (event) =>
      isEventVisibleToProvider(event, providerId) &&
      isEventVisibleForCutoff(event, providerId, cutoff) &&
      isApplicationSentEventVisibleToProvider(event, providerId),
  );

  const lastViewedTimelineAt =
    application.providerReadStates[0]?.lastViewedTimelineAt ?? null;

  const resolver = buildThreadMessageResolver(application.providerApplications);

  return {
    events: visibleEvents.map((event) => mapEvent(event, resolver)),
    newEventCount: countNewEvents(visibleEvents, lastViewedTimelineAt),
    lastViewedTimelineAt,
  };
}

export async function markStaffTimelineViewed(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
): Promise<void> {
  if (
    !(await staffOwnsApplication(prisma, applicationId, staffPseudonymizedId))
  ) {
    applicationNotFound();
  }

  await touchStaffTimelineReadState(
    prisma,
    applicationId,
    staffPseudonymizedId,
    {
      lastViewedTimelineAt: new Date(),
    },
  );
}

export async function markProviderTimelineViewed(
  prisma: PrismaClient,
  reader: ProviderTimelineReader,
  applicationId: string,
): Promise<void> {
  if (
    !(await providerOwnsApplication(prisma, applicationId, reader.providerId))
  ) {
    applicationNotFound();
  }

  await touchProviderTimelineReadState(prisma, applicationId, reader, {
    lastViewedTimelineAt: new Date(),
  });
}

export async function markStaffModalOpened(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
): Promise<void> {
  if (
    !(await staffOwnsApplication(prisma, applicationId, staffPseudonymizedId))
  ) {
    applicationNotFound();
  }

  await touchStaffTimelineReadState(
    prisma,
    applicationId,
    staffPseudonymizedId,
    {
      lastOpenedModalAt: new Date(),
    },
  );
}

export async function markProviderModalOpened(
  prisma: PrismaClient,
  reader: ProviderTimelineReader,
  applicationId: string,
): Promise<void> {
  if (
    !(await providerOwnsApplication(prisma, applicationId, reader.providerId))
  ) {
    applicationNotFound();
  }

  await touchProviderTimelineReadState(prisma, applicationId, reader, {
    lastOpenedModalAt: new Date(),
  });
}
