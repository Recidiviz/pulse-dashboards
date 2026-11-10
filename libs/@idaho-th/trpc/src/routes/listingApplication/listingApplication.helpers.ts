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
  ApplicationSubStage,
  type Prisma,
} from "~@idaho-th/prisma/client";
import {
  APPLICATION_LAST_UPDATED_STATUS,
  APPLICATION_STALE_ACTIVITY_DAYS,
  type ApplicationLastUpdatedStatus,
  computeReleaseTaskProgress,
  type VisibleAlert,
} from "~@idaho-th/shared";
import {
  type AlertRow,
  toVisibleAlerts,
} from "~@idaho-th/trpc/routes/alert/alert.helpers";
import { subtractDays } from "~@idaho-th/trpc/routes/housing-common/applicationRecordQuery";
import type { WorkflowRecordWithUpdatedAt } from "~@idaho-th/trpc/routes/housing-common/housingApplication.types";

import type {
  ApplicationDashboardCore,
  ApplicationDashboardListItem,
  ProviderApplicationDashboardListItem,
  ProviderApplicationRecord,
  StaffApplicationDashboardListItem,
  StaffApplicationRecord,
} from "./listingApplication.types";

/**
 * The viewer's read state, from whichever of the two tables the query selected
 * — the staff one is keyed on the person, the provider one on the organization.
 * Both were already filtered to this viewer, so there is nothing left to match.
 */
function readLastOpenedModalAt(
  application: ApplicationDashboardCore,
): Date | null {
  const readStates =
    "providerReadStates" in application
      ? application.providerReadStates
      : application.staffReadStates;
  return readStates[0]?.lastOpenedModalAt ?? null;
}

/**
 * "New Updates": another user's timeline action landed after this viewer's
 * most recent modal open (or the viewer has never opened the modal at all).
 * `application.timelineEvents` is already scoped by the query to events
 * visible to this viewer and not authored by them (see
 * `buildOtherViewerEventsWhere`), so only the most recent one matters here.
 */
export function deriveLastUpdatedStatus(
  application: ApplicationDashboardCore,
  now: Date = new Date(),
): ApplicationLastUpdatedStatus | null {
  const lastOpenedModalAt = readLastOpenedModalAt(application);
  const latestOtherEvent = application.timelineEvents[0];

  const hasNewUpdates =
    latestOtherEvent != null &&
    (lastOpenedModalAt === null ||
      latestOtherEvent.createdAt > lastOpenedModalAt);
  if (hasNewUpdates) {
    return APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES;
  }

  const staleThreshold = subtractDays(now, APPLICATION_STALE_ACTIVITY_DAYS);
  if (application.lastActivityAt < staleThreshold) {
    return APPLICATION_LAST_UPDATED_STATUS.NO_UPDATES_30D;
  }

  return null;
}

/**
 * A match that closed without this provider: the application went on and they
 * are not on it. The badge, the frozen date and the last-updated filter all
 * resolve the rule from here, so a stage or sub-stage added to it cannot reach
 * one of them and miss the others.
 */
export const CLOSED_WITHOUT_PROVIDER_WHERE = {
  stage: ApplicationStage.CLOSED,
  subStage: {
    in: [
      ApplicationSubStage.CANCELED,
      ApplicationSubStage.NOT_SELECTED,
      ApplicationSubStage.DECLINED,
      ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
    ],
  },
} satisfies Prisma.ProviderHousingApplicationWhereInput;

const CLOSED_WITHOUT_PROVIDER_SUB_STAGES = new Set<ApplicationSubStage>(
  CLOSED_WITHOUT_PROVIDER_WHERE.subStage.in,
);

// Checks if the provider is no longer a part of the application
export function isClosedWithoutProvider(providerApplication: {
  stage: ApplicationStage;
  subStage: ApplicationSubStage | null;
}): boolean {
  const { stage, subStage } = providerApplication;
  return (
    stage === CLOSED_WITHOUT_PROVIDER_WHERE.stage &&
    subStage != null &&
    CLOSED_WITHOUT_PROVIDER_SUB_STAGES.has(subStage)
  );
}

/** A provider closed out of the application sees none of its alerts. */
export function toProviderVisibleAlerts(
  providerApplication: Parameters<typeof isClosedWithoutProvider>[0],
  alerts: AlertRow[],
): VisibleAlert[] {
  return isClosedWithoutProvider(providerApplication)
    ? []
    : toVisibleAlerts(alerts);
}

/** A provider whose application closed without them, sees only the date, no status. */
function deriveProviderLastUpdatedStatus(
  application: ApplicationDashboardCore,
  providerApplication: ProviderApplicationRecord,
): ApplicationLastUpdatedStatus | null {
  if (isClosedWithoutProvider(providerApplication)) {
    return null;
  }
  return deriveLastUpdatedStatus(application);
}

/**
 * Fields every dashboard row shares, whichever viewer is reading it.
 *
 * `lastUpdatedAt` is passed in rather than read from the application, because
 * the case-wide value is not every viewer's answer: a provider closed out of
 * the application must not learn from it that the case is still moving.
 */
function mapDashboardListItem(
  application: ApplicationDashboardCore,
  record: WorkflowRecordWithUpdatedAt,
  lastUpdatedAt: Date,
): ApplicationDashboardListItem {
  const completedReleaseTaskCount = application.homePlan?._count.releaseTasks;

  return {
    id: application.id,
    clientName: application.clientName,
    expectedReleaseDate: application.expectedReleaseDate,
    idocNumber: application.idocNumber,
    stage: record.stage,
    subStage: record.subStage,
    status: record.status,
    releaseTaskProgress: computeReleaseTaskProgress(
      record.stage,
      completedReleaseTaskCount,
    ),
    lastUpdatedAt,
  };
}

export function toStaffListItem(
  record: StaffApplicationRecord,
): StaffApplicationDashboardListItem {
  const { application, intakeStatus, closedOutcome, closedOutcomeNote } =
    record;

  return {
    ...mapDashboardListItem(application, record, application.lastActivityAt),
    lastUpdatedStatus: deriveLastUpdatedStatus(application),
    intakeStatus: intakeStatus,
    closedOutcome: closedOutcome,
    closedOutcomeNote: closedOutcomeNote,
  };
}

export function toProviderListItem(
  record: ProviderApplicationRecord,
  viewerProviderId?: string,
): ProviderApplicationDashboardListItem {
  const { application } = record;

  const lastUpdatedAt = isClosedWithoutProvider(record)
    ? record.updatedAt
    : application.lastActivityAt;

  return {
    ...mapDashboardListItem(application, record, lastUpdatedAt),
    lastUpdatedStatus: deriveProviderLastUpdatedStatus(application, record),
    alerts: toProviderVisibleAlerts(record, application.alerts),
    providerApplicationId: record.id,
    ...(viewerProviderId !== undefined
      ? {
          isSelectedProvider:
            application.homePlan?.selectedProviderId === viewerProviderId,
        }
      : {}),
  };
}
