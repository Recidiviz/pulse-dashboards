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

import {
  ApplicationStage,
  type Prisma,
  type PrismaClient,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  type HousingApplicationTimelineEventProperties,
  segment,
} from "~@idaho-th/trpc/routes/common/segment";
import { throwStaffCaseClosed } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";

import { buildTimelineEventDescription } from "./timeline.descriptions";
import type {
  RecordTimelineEventArgs,
  TimelineActor,
  TimelineEventInput,
} from "./timeline.types";

type TimelineEventMetadataExtractor<K extends TimelineEventInput["type"]> = (
  input: Extract<TimelineEventInput, { type: K }>,
) => Prisma.InputJsonValue;

const TIMELINE_EVENT_METADATA_EXTRACTORS: Partial<{
  [K in TimelineEventInput["type"]]: TimelineEventMetadataExtractor<K>;
}> = {
  [TimelineEventType.APPLICATION_SENT_TO_PROVIDERS]: (input) => ({
    providerCount: input.providerCount,
    providerIds: input.providerIds,
  }),
  [TimelineEventType.PROVIDER_REQUESTED_INFO]: (input) => ({
    infoRequestId: input.infoRequestId,
  }),
  [TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL]: (input) => ({
    threadId: input.threadId,
  }),
  [TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST]: (input) => ({
    infoRequestId: input.infoRequestId,
    infoRequestMessageId: input.infoRequestMessageId,
  }),
  [TimelineEventType.RELEASE_TASK_UPDATED]: (input) => ({
    releaseTaskType: input.releaseTaskType,
    completed: input.completed,
  }),
  [TimelineEventType.RELEASE_TASK_NOTE_UPDATED]: (input) => ({
    releaseTaskType: input.releaseTaskType,
  }),
  [TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED]: (input) => ({
    expectedReleaseDate: input.expectedReleaseDate,
  }),
  [TimelineEventType.STAGE_ADVANCED]: (input) => ({
    fromStage: input.fromStage,
    toStage: input.toStage,
  }),
  [TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED]: (input) => ({
    decision: input.decision,
  }),
  [TimelineEventType.CASE_CLOSED]: (input) => ({
    closedSubStage: input.closedSubStage,
  }),
  [TimelineEventType.DOCUMENT_DOWNLOADED]: (input) => ({
    fileName: input.fileName,
  }),
};

function timelineEventMetadata(
  input: TimelineEventInput,
): Prisma.InputJsonValue | undefined {
  const extract = TIMELINE_EVENT_METADATA_EXTRACTORS[input.type];
  return extract?.(input as never);
}

// Event types whose DB metadata carries PII (DOCUMENT_DOWNLOADED.fileName is
// the client's own uploaded filename, e.g. "Smith, John - housing app.pdf";
// EXPECTED_RELEASE_DATE_UPDATED.expectedReleaseDate keyed to an
// applicationId is client PII too). Storing that in our own Postgres is
// fine; sending it to a third party (Segment) is not.
const ANALYTICS_UNSAFE_METADATA_EVENT_TYPES = new Set<TimelineEventType>([
  TimelineEventType.DOCUMENT_DOWNLOADED,
  TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED,
]);

// Same as timelineEventMetadata(), but with PII-bearing event types'
// metadata dropped entirely before it reaches Segment. Every other event
// type's metadata is IDs, enums, or counts, so it's safe to forward as-is.
function analyticsMetadata(
  input: TimelineEventInput,
): Prisma.InputJsonValue | undefined {
  if (ANALYTICS_UNSAFE_METADATA_EVENT_TYPES.has(input.type)) {
    return undefined;
  }
  return timelineEventMetadata(input);
}

function actorPseudonymizedId(actor: TimelineActor): string | null {
  return "pseudonymizedId" in actor ? actor.pseudonymizedId : null;
}

const TIMELINE_EVENTS_ALLOWED_WHEN_STAFF_CASE_CLOSED =
  new Set<TimelineEventType>([
    TimelineEventType.CASE_CLOSED,
    TimelineEventType.APPROVALS_HOUSING_PLAN_REJECTED,
    TimelineEventType.DOCUMENT_DOWNLOADED,
  ]);

async function assertTimelineEventAllowed(
  tx: Prisma.TransactionClient,
  applicationId: string,
  eventType: TimelineEventType,
): Promise<void> {
  if (TIMELINE_EVENTS_ALLOWED_WHEN_STAFF_CASE_CLOSED.has(eventType)) {
    return;
  }

  if (
    !("staffHousingApplication" in tx) ||
    typeof tx.staffHousingApplication.findFirst !== "function"
  ) {
    return;
  }

  const staffApplication = await tx.staffHousingApplication.findFirst({
    where: { applicationId },
    select: { stage: true },
  });

  if (staffApplication?.stage === ApplicationStage.CLOSED) {
    throwStaffCaseClosed();
  }
}

// recordTimelineEvent runs inside a Prisma interactive transaction, which
// can still roll back after it returns (a later statement in the same
// transaction can fail). Tracking immediately would report events for
// writes that never committed, so each event is queued here, keyed by the
// `tx` instance, and only sent once the caller confirms the transaction
// committed by calling flushTimelineEventAnalytics(tx) with that same
// instance.
const pendingTimelineEventAnalytics = new WeakMap<
  Prisma.TransactionClient,
  HousingApplicationTimelineEventProperties[]
>();

export async function recordTimelineEvent(
  tx: Prisma.TransactionClient,
  args: RecordTimelineEventArgs,
) {
  await assertTimelineEventAllowed(tx, args.applicationId, args.type);

  const actorId = actorPseudonymizedId(args.actor);
  const metadata = timelineEventMetadata(args);

  const event = await tx.housingApplicationTimelineEvent.create({
    data: {
      applicationId: args.applicationId,
      eventType: args.type,
      description: buildTimelineEventDescription(args),
      actorRole: args.actor.role,
      actorPseudonymizedId: actorId,
      scopedProviderId: args.scopedProviderId ?? null,
      cmOnly: args.cmOnly ?? false,
      metadata,
      createdAt: args.createdAt,
    },
  });

  // Mirrors the row just written -- this is the admin panel's only source of
  // truth for every application/stage/provider lifecycle metric, so every
  // TimelineEventType must land here, not just a curated subset. Uses
  // analyticsMetadata() (not the `metadata` written above) so PII-bearing
  // fields never reach Segment.
  const pending = pendingTimelineEventAnalytics.get(tx) ?? [];
  pending.push({
    applicationId: args.applicationId,
    eventType: args.type,
    actorRole: args.actor.role,
    actorPseudonymizedId: actorId,
    scopedProviderId: args.scopedProviderId ?? null,
    cmOnly: args.cmOnly ?? false,
    metadata: analyticsMetadata(args),
  });
  pendingTimelineEventAnalytics.set(tx, pending);

  return event;
}

/**
 * Sends every "backend_idaho_th_housing_application_timeline_event" queued by
 * recordTimelineEvent() calls made with this same `tx` instance. Does not
 * call segment.flush() -- the SDK guards against overlapping flush calls by
 * warning and no-op'ing, so calling it here on every transaction commit
 * would routinely collide under concurrent requests. Buffered events are
 * instead flushed once, on process shutdown, via the Fastify `onClose` hook
 * (see apps/@idaho-th/server/src/server/releaseResources.ts) calling
 * segment.closeAndFlush(). Call this function exactly once, right after the
 * `prisma.$transaction(...)` call that produced `tx` has resolved
 * successfully -- never from inside the transaction callback itself, since
 * the transaction can still roll back after that point.
 */
export function flushTimelineEventAnalytics(
  tx: Prisma.TransactionClient,
): void {
  const pending = pendingTimelineEventAnalytics.get(tx);
  if (!pending) return;

  pendingTimelineEventAnalytics.delete(tx);
  for (const properties of pending) {
    segment.track(
      "backend_idaho_th_housing_application_timeline_event",
      properties,
    );
  }
}

/**
 * Runs `fn` inside a `prisma.$transaction(...)`, then flushes whatever
 * timeline-event analytics `fn` queued via recordTimelineEvent() -- once the
 * transaction has actually committed. Prefer this over calling
 * `prisma.$transaction(...)` directly wherever `fn` may call
 * recordTimelineEvent(): capturing `tx` in an outer variable and remembering
 * to call flushTimelineEventAnalytics() after is easy to get wrong (or
 * forget) by hand; this makes the correct sequencing structural instead of a
 * convention every call site has to repeat.
 */
export async function withTimelineAnalytics<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number },
): Promise<T> {
  let committedTx: Prisma.TransactionClient | undefined;
  const result = await prisma.$transaction(async (tx) => {
    committedTx = tx;
    return fn(tx);
  }, options);
  if (committedTx) flushTimelineEventAnalytics(committedTx);
  return result;
}

/**
 * Bumps HousingApplication.lastActivityAt — the canonical "Last Updated"
 * value for the dashboard (sort, filter, and column display all read from
 * it). Call this exactly once per transaction, after all recordTimelineEvent()
 * calls, or better: merge `lastActivityAt` directly into an existing
 * `housingApplication.update()` call in the same transaction to avoid an
 * extra round-trip.
 */
export async function updateApplicationLastActivityAt(
  tx: Prisma.TransactionClient,
  applicationId: string,
  at: Date = new Date(),
): Promise<void> {
  await tx.housingApplication.update({
    where: { id: applicationId },
    data: { lastActivityAt: at },
  });
}

export function buildInitialApplicationTimelineEventsCreate(
  staffPseudonymizedId: string,
  stage: ApplicationStage = ApplicationStage.DRAFT,
): Prisma.HousingApplicationTimelineEventCreateWithoutApplicationInput[] {
  const applicationCreated: TimelineEventInput = {
    type: TimelineEventType.APPLICATION_CREATED,
  };
  const stageAdvanced: TimelineEventInput = {
    type: TimelineEventType.STAGE_ADVANCED,
    fromStage: stage,
    toStage: stage,
  };

  return [
    {
      eventType: applicationCreated.type,
      description: buildTimelineEventDescription(applicationCreated),
      actorRole: TimelineActorRole.STAFF,
      actorPseudonymizedId: staffPseudonymizedId,
      scopedProviderId: applicationCreated.scopedProviderId ?? null,
      cmOnly: applicationCreated.cmOnly ?? false,
    },
    {
      eventType: stageAdvanced.type,
      description: buildTimelineEventDescription(stageAdvanced),
      actorRole: TimelineActorRole.SYSTEM,
      metadata: timelineEventMetadata(stageAdvanced),
      scopedProviderId: stageAdvanced.scopedProviderId ?? null,
      cmOnly: stageAdvanced.cmOnly ?? false,
    },
  ];
}
