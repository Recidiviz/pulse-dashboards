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
  Prisma,
  type PrismaClient,
  TimelineViewerRole,
} from "~@idaho-th/prisma/client";
import {
  APPLICATION_FILTER_LAST_UPDATED,
  APPLICATION_RECENT_ACTIVITY_DAYS,
  APPLICATION_STALE_ACTIVITY_DAYS,
} from "~@idaho-th/shared";
import { subtractDays } from "~@idaho-th/trpc/routes/housing-common/applicationRecordQuery";

import { CLOSED_WITHOUT_PROVIDER_WHERE } from "./listingApplication.helpers";
import type {
  DashboardViewer,
  ProviderDashboardViewer,
  StaffDashboardViewer,
} from "./listingApplication.types";

/**
 * The viewer-dependent halves of the raw query, resolved in one place.
 *
 * Since the read-state tables were split there is no viewer-role column left
 * to filter on: the viewer's branch simply names a different table and a
 * different key, and the role never reaches the SQL as a value. Keeping all
 * three fragments together is what stops a later change from scoping the owner
 * lookup one way and the read state another.
 */
type ViewerScopeSql = {
  ownerScope: Prisma.Sql;
  /** Extra predicates narrowing the events this viewer may be nudged about. */
  visibleEvents: Prisma.Sql;
  lastOpenedModalAt: Prisma.Sql;
};

function providerScopeSql(viewer: ProviderDashboardViewer): ViewerScopeSql {
  return {
    ownerScope: Prisma.sql`
      EXISTS (
        SELECT 1 FROM "ProviderHousingApplication" pha
        WHERE pha."applicationId" = app.id AND pha."providerId" = ${viewer.providerId}
      )
    `,
    visibleEvents: Prisma.sql`AND e."cmOnly" = false AND (e."scopedProviderId" IS NULL OR e."scopedProviderId" = ${viewer.providerId})`,
    // Keyed on the organization: any colleague's read suppresses the nudge for
    // everyone there.
    lastOpenedModalAt: Prisma.sql`
      SELECT rs."lastOpenedModalAt" FROM "ProviderTimelineReadState" rs
      WHERE rs."applicationId" = app.id AND rs."providerId" = ${viewer.providerId}
    `,
  };
}

function staffScopeSql(viewer: StaffDashboardViewer): ViewerScopeSql {
  return {
    ownerScope: Prisma.sql`
      EXISTS (
        SELECT 1 FROM "StaffHousingApplication" sha
        WHERE sha."applicationId" = app.id AND sha."staffPseudonymizedId" = ${viewer.pseudonymizedId}
      )
    `,
    visibleEvents: Prisma.empty,
    lastOpenedModalAt: Prisma.sql`
      SELECT rs."lastOpenedModalAt" FROM "StaffTimelineReadState" rs
      WHERE rs."applicationId" = app.id AND rs."staffPseudonymizedId" = ${viewer.pseudonymizedId}
    `,
  };
}

function buildViewerScopeSql(viewer: DashboardViewer): ViewerScopeSql {
  return viewer.role === TimelineViewerRole.PROVIDER
    ? providerScopeSql(viewer)
    : staffScopeSql(viewer);
}

function buildHasNewUpdatesSql(
  viewer: DashboardViewer,
  scope: ViewerScopeSql,
): Prisma.Sql {
  return Prisma.sql`
    EXISTS (
      SELECT 1 FROM "HousingApplicationTimelineEvent" e
      WHERE e."applicationId" = app.id
        AND (e."actorPseudonymizedId" IS NULL OR e."actorPseudonymizedId" <> ${viewer.pseudonymizedId})
        ${scope.visibleEvents}
        AND e."createdAt" > COALESCE(
          (${scope.lastOpenedModalAt}),
          '-infinity'::timestamp
        )
    )
  `;
}

/**
 * Removes applications this provider was closed out of.
 *
 * Both buckets read `app."lastActivityAt"`, which is case-wide, so a provider
 * who lost the application would otherwise be matched on activity that
 * happened after they were cut off — "past 7 days" returning a case still
 * moving without them, or "no updates 30d" dropping their row because someone
 * else has been working it.
 *
 * Dropping the rows rather than re-dating them is what keeps the filter
 * honest: `deriveProviderLastUpdatedStatus` returns null for exactly these
 * records, so they carry no last-updated status at all, and a filter over that
 * status should place them in neither bucket. Expressed as a typed query
 * rather than a predicate inside the raw SQL so that it can reuse
 * CLOSED_WITHOUT_PROVIDER_WHERE, the one definition the badge and the frozen
 * date also resolve the rule from.
 *
 * Staff are unaffected — they are never closed out of their own caseload.
 */
async function dropClosedOutApplications(
  prisma: PrismaClient,
  viewer: DashboardViewer,
  ids: string[],
): Promise<string[]> {
  if (viewer.role !== TimelineViewerRole.PROVIDER || ids.length === 0) {
    return ids;
  }

  const closedOut = await prisma.providerHousingApplication.findMany({
    where: {
      providerId: viewer.providerId,
      applicationId: { in: ids },
      ...CLOSED_WITHOUT_PROVIDER_WHERE,
    },
    select: { applicationId: true },
  });
  if (closedOut.length === 0) return ids;

  const excluded = new Set(closedOut.map((row) => row.applicationId));
  return ids.filter((id) => !excluded.has(id));
}

export async function buildViewerLastUpdatedWhere(
  prisma: PrismaClient,
  viewer: DashboardViewer,
  selected?: string[],
): Promise<{ id?: { in: string[] } }> {
  if (
    !selected?.length ||
    selected.includes(APPLICATION_FILTER_LAST_UPDATED.ALL)
  ) {
    return {};
  }

  const wantsUpdatedInPast7d = selected.includes(
    APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
  );
  const wantsNoUpdates = selected.includes(
    APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D,
  );
  if (!wantsUpdatedInPast7d && !wantsNoUpdates) return {};

  const now = new Date();
  const recentThreshold = subtractDays(now, APPLICATION_RECENT_ACTIVITY_DAYS);
  const staleThreshold = subtractDays(now, APPLICATION_STALE_ACTIVITY_DAYS);

  const scope = buildViewerScopeSql(viewer);

  const conditions: Prisma.Sql[] = [];
  if (wantsUpdatedInPast7d) {
    conditions.push(Prisma.sql`app."lastActivityAt" >= ${recentThreshold}`);
  }
  if (wantsNoUpdates) {
    conditions.push(
      Prisma.sql`(NOT ${buildHasNewUpdatesSql(viewer, scope)} AND app."lastActivityAt" < ${staleThreshold})`,
    );
  }

  const bucketMatch =
    conditions.length === 1
      ? conditions[0]
      : Prisma.sql`(${Prisma.join(conditions, " OR ")})`;
  const combined = Prisma.sql`${scope.ownerScope} AND ${bucketMatch}`;

  // No LIMIT: this is scoped to one viewer's own caseload via the owner scope
  // (a handful of applications at current pilot scale),
  // not the whole table. Revisit with a cap if a single viewer's caseload
  // grows large enough for the id list itself to become a concern.
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT app.id FROM "HousingApplication" app WHERE ${combined}
  `);

  const ids = await dropClosedOutApplications(
    prisma,
    viewer,
    rows.map((row) => row.id),
  );

  return { id: { in: ids } };
}
