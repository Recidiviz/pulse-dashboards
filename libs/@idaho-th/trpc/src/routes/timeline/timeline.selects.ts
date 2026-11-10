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

import { type Prisma, ThreadType } from "~@idaho-th/prisma/client";

export const TIMELINE_EVENT_SELECT = {
  id: true,
  eventType: true,
  description: true,
  actorRole: true,
  metadata: true,
  scopedProviderId: true,
  cmOnly: true,
  createdAt: true,
} as const satisfies Prisma.HousingApplicationTimelineEventSelect;

export const TIMELINE_EVENT_ORDER_BY = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
] as const satisfies Prisma.HousingApplicationTimelineEventOrderByWithRelationInput[];

// Threads whose provider-authored opening message the timeline shows.
export const TIMELINE_THREAD_SELECT = {
  threads: {
    where: {
      type: {
        in: [ThreadType.INFO_REQUEST, ThreadType.CONDITIONAL_APPROVAL_REVOKED],
      },
    },
    select: {
      id: true,
      messages: {
        select: { id: true, senderType: true, body: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
} as const satisfies Prisma.ProviderHousingApplicationSelect;

export const TIMELINE_PROVIDER_APPLICATION_SELECT = {
  providerId: true,
  stage: true,
  ...TIMELINE_THREAD_SELECT,
} as const satisfies Prisma.ProviderHousingApplicationSelect;

export const STAFF_TIMELINE_APPLICATION_SELECT = {
  providerApplications: { select: TIMELINE_THREAD_SELECT },
  timelineEvents: {
    select: TIMELINE_EVENT_SELECT,
    orderBy: TIMELINE_EVENT_ORDER_BY,
  },
  staffReadStates: {
    select: { lastViewedTimelineAt: true },
    take: 1,
  },
} as const satisfies Prisma.HousingApplicationSelect;

export const PROVIDER_TIMELINE_APPLICATION_SELECT = {
  providerApplications: {
    select: TIMELINE_PROVIDER_APPLICATION_SELECT,
    take: 1,
  },
  timelineEvents: {
    select: TIMELINE_EVENT_SELECT,
    orderBy: TIMELINE_EVENT_ORDER_BY,
  },
  providerReadStates: {
    select: { lastViewedTimelineAt: true },
    take: 1,
  },
} as const satisfies Prisma.HousingApplicationSelect;

/** A staff read is the person's own: it never touches what a provider sees. */
export function staffReadStateSelect(staffPseudonymizedId: string) {
  return {
    where: { staffPseudonymizedId },
    select: { lastViewedTimelineAt: true },
    take: 1,
  } as const satisfies Prisma.HousingApplication$staffReadStatesArgs;
}

/**
 * A provider read belongs to the organization, not the person — which is why
 * this is keyed on the verified active `providerId` and one colleague's read
 * answers for all of them.
 */
export function providerReadStateSelect(providerId: string) {
  return {
    where: { providerId },
    select: { lastViewedTimelineAt: true },
    take: 1,
  } as const satisfies Prisma.HousingApplication$providerReadStatesArgs;
}
