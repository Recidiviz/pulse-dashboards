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

import { type Prisma, TimelineViewerRole } from "~@idaho-th/prisma/client";
import { ALERT_SELECT } from "~@idaho-th/trpc/routes/alert/alert.helpers";

import type {
  DashboardViewer,
  ProviderDashboardViewer,
  StaffDashboardViewer,
} from "./listingApplication.types";

export function buildOtherViewerEventsWhere(
  viewer: DashboardViewer,
): Prisma.HousingApplicationTimelineEventWhereInput {
  const notAuthoredByViewer: Prisma.HousingApplicationTimelineEventWhereInput =
    {
      OR: [
        { actorPseudonymizedId: null },
        { actorPseudonymizedId: { not: viewer.pseudonymizedId } },
      ],
    };

  if (viewer.role !== TimelineViewerRole.PROVIDER) {
    return notAuthoredByViewer;
  }

  return {
    AND: [
      notAuthoredByViewer,
      { cmOnly: false },
      {
        OR: [
          { scopedProviderId: null },
          { scopedProviderId: viewer.providerId },
        ],
      },
    ],
  };
}

const DASHBOARD_APPLICATION_SELECT = {
  id: true,
  clientName: true,
  expectedReleaseDate: true,
  idocNumber: true,
  updatedAt: true,
  lastActivityAt: true,
  homePlan: {
    select: {
      selectedProviderId: true,
      _count: {
        select: {
          releaseTasks: { where: { completed: true } },
        },
      },
    },
  },
} as const satisfies Prisma.HousingApplicationSelect;

const LAST_OPENED_MODAL_SELECT = {
  select: { lastOpenedModalAt: true },
  take: 1,
} as const;

/**
 * Only the single most recent event visible to this viewer and not authored by
 * them is needed to answer "New Updates" — the displayed date and the
 * "No Updates (30d)" state both come from lastActivityAt.
 */
function otherViewerEventsSelect(viewer: DashboardViewer) {
  return {
    where: buildOtherViewerEventsWhere(viewer),
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  } as const satisfies Prisma.HousingApplication$timelineEventsArgs;
}

/** A staff read is the person's own and is invisible to every provider. */
export function buildStaffApplicationDashboardSelect(
  viewer: StaffDashboardViewer,
) {
  return {
    ...DASHBOARD_APPLICATION_SELECT,
    staffReadStates: {
      where: { staffPseudonymizedId: viewer.pseudonymizedId },
      ...LAST_OPENED_MODAL_SELECT,
    },
    timelineEvents: otherViewerEventsSelect(viewer),
  } satisfies Prisma.HousingApplicationSelect;
}

/**
 * A provider read belongs to the organization, so the badge clears for every
 * colleague as soon as one of them opens the modal.
 */
export function buildProviderApplicationDashboardSelect(
  viewer: ProviderDashboardViewer,
) {
  return {
    ...DASHBOARD_APPLICATION_SELECT,
    providerReadStates: {
      where: { providerId: viewer.providerId },
      ...LAST_OPENED_MODAL_SELECT,
    },
    timelineEvents: otherViewerEventsSelect(viewer),
    alerts: {
      where: { providerId: viewer.providerId, dismissedAt: null },
      select: ALERT_SELECT,
      orderBy: { createdAt: "desc" },
    },
  } satisfies Prisma.HousingApplicationSelect;
}
