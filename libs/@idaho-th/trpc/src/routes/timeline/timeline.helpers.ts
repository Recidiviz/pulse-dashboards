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

import { type Prisma, TimelineEventType } from "~@idaho-th/prisma/client";
import {
  buildApplicationWhereForProvider,
  buildApplicationWhereForStaff,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import { isVisibleForCutoff } from "~@idaho-th/trpc/routes/housing-common/providerVisibility";

import {
  PROVIDER_TIMELINE_APPLICATION_SELECT,
  providerReadStateSelect,
  STAFF_TIMELINE_APPLICATION_SELECT,
  staffReadStateSelect,
  TIMELINE_EVENT_ORDER_BY,
  TIMELINE_EVENT_SELECT,
} from "./timeline.selects";
import type {
  DbClient,
  ProviderTimelineApplicationRow,
  ProviderTimelineReader,
  StaffTimelineApplicationRow,
  TimelineReadStatePatch,
} from "./timeline.types";

export const TIMELINE_APPLICATION_NOT_FOUND = "Application not found";

export function isEventVisibleToProvider(
  event: { scopedProviderId: string | null; cmOnly: boolean },
  providerId: string,
): boolean {
  if (event.cmOnly) {
    return false;
  }
  return (
    event.scopedProviderId === null || event.scopedProviderId === providerId
  );
}

export function isApplicationSentEventVisibleToProvider(
  event: { eventType: TimelineEventType; metadata: unknown },
  providerId: string,
): boolean {
  if (event.eventType !== TimelineEventType.APPLICATION_SENT_TO_PROVIDERS) {
    return true;
  }
  const providerIds = (event.metadata as { providerIds?: unknown } | null)
    ?.providerIds;
  if (!Array.isArray(providerIds)) {
    return false;
  }
  return providerIds.includes(providerId);
}

function staffVisibleEventsWhere(
  includeProviderNotSelected: boolean,
): Prisma.HousingApplicationTimelineEventWhereInput | undefined {
  if (includeProviderNotSelected) {
    return undefined;
  }
  return {
    eventType: {
      notIn: [
        TimelineEventType.PROVIDER_NOT_SELECTED,
        TimelineEventType.PROVIDER_CANCELED,
      ],
    },
  };
}

export async function findStaffTimelineApplication(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
  includeProviderNotSelected: boolean,
): Promise<StaffTimelineApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForStaff(applicationId, staffPseudonymizedId),
    select: {
      ...STAFF_TIMELINE_APPLICATION_SELECT,
      timelineEvents: {
        where: staffVisibleEventsWhere(includeProviderNotSelected),
        select: TIMELINE_EVENT_SELECT,
        orderBy: TIMELINE_EVENT_ORDER_BY,
      },
      staffReadStates: staffReadStateSelect(staffPseudonymizedId),
    },
  });
}

function providerVisibleEventsWhere(
  providerId: string,
): Prisma.HousingApplicationTimelineEventWhereInput {
  return {
    cmOnly: false,
    OR: [{ scopedProviderId: null }, { scopedProviderId: providerId }],
  };
}

export async function findProviderTimelineApplication(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderTimelineApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: {
      ...PROVIDER_TIMELINE_APPLICATION_SELECT,
      providerApplications: {
        where: { providerId },
        select:
          PROVIDER_TIMELINE_APPLICATION_SELECT.providerApplications.select,
        take: 1,
      },
      timelineEvents: {
        where: providerVisibleEventsWhere(providerId),
        select: TIMELINE_EVENT_SELECT,
        orderBy: TIMELINE_EVENT_ORDER_BY,
      },
      providerReadStates: providerReadStateSelect(providerId),
    },
  });
}

export function isEventVisibleForCutoff(
  event: { scopedProviderId: string | null; createdAt: Date },
  providerId: string,
  cutoff: Date | null,
): boolean {
  return isVisibleForCutoff(
    event.createdAt,
    event.scopedProviderId === providerId,
    cutoff,
  );
}

export async function staffOwnsApplication(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<boolean> {
  const count = await client.housingApplication.count({
    where: buildApplicationWhereForStaff(applicationId, staffPseudonymizedId),
  });
  return count > 0;
}

export async function providerOwnsApplication(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<boolean> {
  const count = await client.housingApplication.count({
    where: buildApplicationWhereForProvider(applicationId, providerId),
  });
  return count > 0;
}

/**
 * Staff read state is keyed on the person alone. There is no foreign key to
 * `HousingStaff` — those rows are created lazily by the Intercom sync, so a
 * staff member can read a timeline before their record exists.
 */
export async function touchStaffTimelineReadState(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
  patch: TimelineReadStatePatch,
) {
  return client.staffTimelineReadState.upsert({
    where: {
      applicationId_staffPseudonymizedId: {
        applicationId,
        staffPseudonymizedId,
      },
    },
    create: { applicationId, staffPseudonymizedId, ...patch },
    update: { ...patch },
  });
}

/**
 * Provider read state is keyed on the organization, so one colleague opening a
 * timeline marks it read for all of them. `providerUserId` records who last did
 * it and is attribution only — never a filter.
 */
export async function touchProviderTimelineReadState(
  client: DbClient,
  applicationId: string,
  { providerId, providerUserId }: ProviderTimelineReader,
  patch: TimelineReadStatePatch,
) {
  return client.providerTimelineReadState.upsert({
    where: { applicationId_providerId: { applicationId, providerId } },
    create: { applicationId, providerId, providerUserId, ...patch },
    update: { providerUserId, ...patch },
  });
}
