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
  type Prisma,
  type PrismaClient,
  TimelineViewerRole,
} from "~@idaho-th/prisma/client";
import {
  buildClosedCaseDashboardVisibilityWhere,
  listApplicationRecords,
  type ListApplicationRecordsConfig,
} from "~@idaho-th/trpc/routes/housing-common/applicationRecordQuery";
import { buildFiltersArg } from "~@idaho-th/trpc/utils/filters";
import type { CursorPaginatedResult } from "~@idaho-th/trpc/utils/pagination";

import {
  toProviderListItem,
  toStaffListItem,
} from "./listingApplication.helpers";
import { buildViewerLastUpdatedWhere } from "./listingApplication.lastUpdatedFilter";
import {
  buildProviderApplicationDashboardSelect,
  buildStaffApplicationDashboardSelect,
} from "./listingApplication.selects";
import type {
  ApplicationDashboardListItem,
  DashboardViewer,
  ListApplicationsInput,
  ProviderApplicationDashboardListItem,
  ProviderApplicationRecord,
  ProviderDashboardViewer,
  StaffApplicationDashboardListItem,
  StaffApplicationRecord,
  StaffDashboardViewer,
} from "./listingApplication.types";

type ListHousingApplicationsConfig<
  TRecord extends { id: string },
  TItem extends ApplicationDashboardListItem,
> = ListApplicationRecordsConfig & {
  where: Record<string, unknown>;
  viewer: DashboardViewer;
  toListItem: (record: TRecord) => TItem;
  homePlanApplicationWhere?: Record<string, unknown>;
};

async function listHousingApplications<
  TRecord extends { id: string },
  TItem extends ApplicationDashboardListItem,
>(
  prisma: PrismaClient,
  config: ListHousingApplicationsConfig<TRecord, TItem>,
  input: ListApplicationsInput,
): Promise<CursorPaginatedResult<TItem>> {
  const { pagination, sorting, search, filters } = input;
  const { recordWhere, applicationWhere } = buildFiltersArg(filters);
  const lastUpdatedWhere = await buildViewerLastUpdatedWhere(
    prisma,
    config.viewer,
    filters?.lastUpdated,
  );

  const { stage: stageWhere, ...otherRecordWhere } = recordWhere;
  const homePlanWhere = config.homePlanApplicationWhere
    ? { application: { is: config.homePlanApplicationWhere } }
    : undefined;
  let stageOrHomePlanWhere: Record<string, unknown> = {};
  if (homePlanWhere) {
    stageOrHomePlanWhere = {
      OR: [...(stageWhere ? [{ stage: stageWhere }] : []), homePlanWhere],
    };
  } else if (stageWhere) {
    stageOrHomePlanWhere = { stage: stageWhere };
  }

  // The closed-case visibility window always applies, even when the viewer
  // filters the Stage column to Closed
  const scopedWhere = {
    AND: [
      { ...config.where, ...otherRecordWhere, ...stageOrHomePlanWhere },
      buildClosedCaseDashboardVisibilityWhere(),
    ],
  };

  const result = await listApplicationRecords<TRecord>(
    { prismaModel: config.prismaModel, include: config.include },
    {
      where: scopedWhere,
      applicationWhere: {
        ...applicationWhere,
        ...lastUpdatedWhere,
      },
      search,
      sorting,
      pagination,
    },
  );

  return {
    items: result.items.map(config.toListItem),
    nextCursor: result.nextCursor,
    total: result.total,
  };
}

export async function getHousingApplicationsByStaff(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: ListApplicationsInput,
): Promise<CursorPaginatedResult<StaffApplicationDashboardListItem>> {
  const viewer: StaffDashboardViewer = {
    role: TimelineViewerRole.CASE_MANAGER,
    pseudonymizedId: staffPseudonymizedId,
  };
  const include = {
    application: { select: buildStaffApplicationDashboardSelect(viewer) },
  } satisfies Prisma.StaffHousingApplicationInclude;

  return listHousingApplications<
    StaffApplicationRecord,
    StaffApplicationDashboardListItem
  >(
    prisma,
    {
      prismaModel: prisma.staffHousingApplication,
      include,
      where: { staffPseudonymizedId },
      viewer,
      toListItem: toStaffListItem,
    },
    input,
  );
}

/** The provider queue's caller: the organization it is acting as, and the person. */
export type ProviderDashboardActor = {
  /** Verified active HousingProvider.id — the whole organization's one shared queue. */
  providerId: string;
  /** The person, used only to exclude their own actions from "New Updates". */
  providerPseudonymizedId: string;
};

export async function getProviderApplications(
  prisma: PrismaClient,
  { providerId, providerPseudonymizedId }: ProviderDashboardActor,
  input: ListApplicationsInput,
): Promise<CursorPaginatedResult<ProviderApplicationDashboardListItem>> {
  const viewer: ProviderDashboardViewer = {
    role: TimelineViewerRole.PROVIDER,
    pseudonymizedId: providerPseudonymizedId,
    providerId,
  };
  const include = {
    application: { select: buildProviderApplicationDashboardSelect(viewer) },
  } satisfies Prisma.ProviderHousingApplicationInclude;

  const homePlanApplicationWhere = input.filters?.homePlan
    ? { homePlan: { is: { selectedProviderId: providerId } } }
    : undefined;

  return listHousingApplications<
    ProviderApplicationRecord,
    ProviderApplicationDashboardListItem
  >(
    prisma,
    {
      prismaModel: prisma.providerHousingApplication,
      include,
      // The organization filter. Without it this query returns every
      // organization's matches, so it is the one line to check on review.
      where: { providerId },
      viewer,
      toListItem: (record) => toProviderListItem(record, providerId),
      homePlanApplicationWhere,
    },
    input,
  );
}
