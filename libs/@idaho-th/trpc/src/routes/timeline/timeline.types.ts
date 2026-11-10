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

import { z } from "zod";

import type {
  ApplicationStage,
  ApplicationSubStage,
  ParoleCommissionDecision,
  Prisma,
  PrismaClient,
  ReleaseTaskType,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";

import type {
  staffTimelineApplicationSchema,
  timelineApplicationSchema,
} from "./timeline.schema";
import type {
  PROVIDER_TIMELINE_APPLICATION_SELECT,
  STAFF_TIMELINE_APPLICATION_SELECT,
  TIMELINE_EVENT_SELECT,
  TIMELINE_THREAD_SELECT,
} from "./timeline.selects";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type TimelineApplicationInput = z.infer<
  typeof timelineApplicationSchema
>;

export type StaffTimelineApplicationInput = z.infer<
  typeof staffTimelineApplicationSchema
>;

export type TimelineEventRow =
  Prisma.HousingApplicationTimelineEventGetPayload<{
    select: typeof TIMELINE_EVENT_SELECT;
  }>;

export type TimelineThreadRow = Prisma.ProviderHousingApplicationGetPayload<{
  select: typeof TIMELINE_THREAD_SELECT;
}>;

export type StaffTimelineApplicationRow = Prisma.HousingApplicationGetPayload<{
  select: typeof STAFF_TIMELINE_APPLICATION_SELECT;
}>;

export type ProviderTimelineApplicationRow =
  Prisma.HousingApplicationGetPayload<{
    select: typeof PROVIDER_TIMELINE_APPLICATION_SELECT;
  }>;

export type TimelineReadStatePatch =
  | { lastViewedTimelineAt: Date }
  | { lastOpenedModalAt: Date };

export type ThreadMessageResolver = {
  byMessageId: Map<string, string>;
  providerMessageByThreadId: Map<string, string>;
};

export type TimelineActor =
  | { role: typeof TimelineActorRole.SYSTEM }
  | {
      role: typeof TimelineActorRole.STAFF | typeof TimelineActorRole.PROVIDER;
      pseudonymizedId: string;
    };

// Every timeline event must declare its provider-visibility scope as part of
// its own type, not as a bolt-on optional field — that's what let a
// provider-facing event get recorded without `cmOnly`/`scopedProviderId` and
// leak to every provider on the application. Exactly one of these four
// shapes applies to each event variant below:
//   - Unscoped: visible to staff and every provider (no scoping fields at all)
//   - ProviderScoped: visible only to the named provider — scopedProviderId
//     is required, so a caller cannot forget to scope it
//   - CmOnlyScoped: hidden from every provider — cmOnly: true is required
//   - ActorScoped: scope depends on which actor performed the action
//     (DOCUMENT_DOWNLOADED), so the caller must explicitly pass the
//     provider id or null
type Unscoped = { scopedProviderId?: never; cmOnly?: never };
type ProviderScoped = { scopedProviderId: string; cmOnly?: never };
type CmOnlyScoped = { scopedProviderId?: never; cmOnly: true };
type ActorScoped = { scopedProviderId: string | null; cmOnly?: never };

export type TimelineEventInput =
  | ({ type: typeof TimelineEventType.APPLICATION_CREATED } & Unscoped)
  | ({
      type: typeof TimelineEventType.APPLICATION_SENT_TO_PROVIDERS;
      providerCount: number;
      providerIds: string[];
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED;
      providerName: string;
    } & ProviderScoped)
  | ({
      type: typeof TimelineEventType.PROVIDER_REQUESTED_INFO;
      providerName: string;
      infoRequestId: string;
    } & ProviderScoped)
  | ({
      type: typeof TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST;
      providerName: string;
      infoRequestId: string;
      infoRequestMessageId: string;
    } & ProviderScoped)
  | ({
      type: typeof TimelineEventType.PROVIDER_DECLINED;
      providerName: string;
    } & ProviderScoped)
  | ({
      type: typeof TimelineEventType.PROVIDER_SELECTED_AS_HOME_PLAN;
      providerName: string;
    } & ProviderScoped)
  | ({ type: typeof TimelineEventType.PROVIDER_NOT_SELECTED } & ProviderScoped)
  | ({ type: typeof TimelineEventType.PROVIDER_CANCELED } & ProviderScoped)
  | ({
      type: typeof TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL;
      providerName: string;
      threadId: string;
    } & ProviderScoped)
  | ({
      type: typeof TimelineEventType.HOME_PLAN_ADDRESS_SET;
      streetAddress: string;
    } & CmOnlyScoped)
  | ({
      type: typeof TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED;
      expectedReleaseDate: string;
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.STAGE_ADVANCED;
      fromStage: ApplicationStage;
      toStage: ApplicationStage;
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED;
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.APPROVALS_HOUSING_PLAN_REJECTED;
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED;
      decision: ParoleCommissionDecision;
    } & CmOnlyScoped)
  | ({
      type: typeof TimelineEventType.RELEASE_TASK_UPDATED;
      releaseTaskType: ReleaseTaskType;
      completed: boolean;
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.RELEASE_TASK_NOTE_UPDATED;
      releaseTaskType: ReleaseTaskType;
    } & Unscoped)
  | ({
      type: typeof TimelineEventType.CASE_CLOSED;
      closedSubStage: ApplicationSubStage;
    } & Unscoped)
  | ({ type: typeof TimelineEventType.DOCUMENT_UPLOADED; fileName: string } & (
      | { scopedProviderId: string; providerName: string; cmOnly?: never }
      | { scopedProviderId: null; providerName?: never; cmOnly?: never }
    ))
  | ({
      type: typeof TimelineEventType.DOCUMENT_DOWNLOADED;
      fileName: string;
      downloadedByRole: "CM" | "Provider";
    } & ActorScoped);

export type RecordTimelineEventArgs = {
  applicationId: string;
  actor: TimelineActor;
  /**
   * Overrides the database default, for events recorded in one transaction
   * that must sort in a fixed order.
   */
  createdAt?: Date;
} & TimelineEventInput;

export type TimelineEventItem = {
  id: string;
  eventType: TimelineEventType;
  description: string;
  message: string | null;
  actorRole: TimelineActorRole;
  createdAt: Date;
};

export type TimelineView = {
  events: TimelineEventItem[];
  newEventCount: number;
  lastViewedTimelineAt: Date | null;
};

/**
 * Who a provider read is recorded for. The organization is what the read state
 * is keyed on — a read by one colleague counts for every colleague — while the
 * person is attribution only, so the team can see who is covering what. It is
 * nullable because an organization with no users has nobody to attribute to.
 */
export type ProviderTimelineReader = {
  providerId: string;
  providerUserId: string | null;
};
