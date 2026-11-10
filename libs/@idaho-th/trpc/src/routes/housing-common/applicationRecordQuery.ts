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
} from "~@idaho-th/prisma/client";
import { APPLICATION_RECENT_ACTIVITY_DAYS } from "~@idaho-th/shared";
import { type SearchParams } from "~@idaho-th/shared/types";
import type {
  CursorPaginatedResult,
  PaginationParams,
} from "~@idaho-th/trpc/utils/pagination";
import {
  buildPaginatedResult,
  buildPaginationArgs,
} from "~@idaho-th/trpc/utils/pagination";
import type { SortingParams } from "~@idaho-th/trpc/utils/sorting";

export type FieldLocation = "self" | "application";

export type FieldMapping = { location: FieldLocation; column?: string };

export const APPLICATION_RECORD_FIELDS: Record<string, FieldMapping> = {
  // Columns on the record (StaffHousingApplication / ProviderHousingApplication).
  stage: { location: "self" },
  subStage: { location: "self" },
  status: { location: "self" },
  clientName: { location: "application" },
  expectedReleaseDate: { location: "application" },
  idocNumber: { location: "application" },
  createdAt: { location: "application" },
  updatedAt: { location: "application" },
  lastActivityAt: { location: "application" },
  dateReceived: { location: "self", column: "createdAt" },
};

const APPLICATION_RELATION = "application" as const;
const DEFAULT_SORT_FIELD = "expectedReleaseDate";
const DEFAULT_SORT_DIRECTION = "asc" as const;

type ListDelegate = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count: (args: any) => Promise<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (args: any) => Promise<any[]>;
};

export type ListApplicationRecordsConfig = {
  prismaModel: ListDelegate;
  /** Record-specific `include` (e.g. application + eligibleProviders). */
  include: unknown;
};

export type ListApplicationRecordsQuery = {
  /** Owner scope + record-local (`self`) filters, already merged by the caller. */
  where: Record<string, unknown>;
  /** Filters that live on the related application (nested under `application`). */
  applicationWhere?: Record<string, unknown>;
  search?: SearchParams;
  sorting?: SortingParams;
  pagination: PaginationParams;
};

function hasKeys(
  obj?: Record<string, unknown>,
): obj is Record<string, unknown> {
  return !!obj && Object.keys(obj).length > 0;
}

function buildRecordSearchArg(
  search?: SearchParams,
): Record<string, unknown> | undefined {
  if (!search) return undefined;

  const selfPart: Record<string, unknown> = {};
  const applicationPart: Record<string, unknown> = {};

  for (const [field, condition] of Object.entries(search)) {
    const mapping = APPLICATION_RECORD_FIELDS[field];
    if (mapping?.location === "self") selfPart[field] = condition;
    else if (mapping?.location === "application")
      applicationPart[field] = condition;
  }

  const parts: Record<string, unknown>[] = [];
  if (hasKeys(selfPart)) parts.push(selfPart);
  if (hasKeys(applicationPart)) {
    parts.push({ [APPLICATION_RELATION]: { is: applicationPart } });
  }

  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : { AND: parts };
}

function buildRecordSortingArg(sorting?: SortingParams): {
  orderBy: Record<string, unknown>[];
} {
  let field = sorting?.field ?? DEFAULT_SORT_FIELD;
  let direction = sorting?.direction ?? DEFAULT_SORT_DIRECTION;

  let mapping = APPLICATION_RECORD_FIELDS[field];
  if (mapping === undefined) {
    field = DEFAULT_SORT_FIELD;
    direction = DEFAULT_SORT_DIRECTION;
    mapping = APPLICATION_RECORD_FIELDS[field];
  }

  const { location, column = field } = mapping as FieldMapping;
  const primary =
    location === "application"
      ? { [APPLICATION_RELATION]: { [column]: direction } }
      : { [column]: direction };

  return { orderBy: [primary, { id: direction }] };
}

export async function listApplicationRecords<TItem extends { id: string }>(
  config: ListApplicationRecordsConfig,
  query: ListApplicationRecordsQuery,
): Promise<CursorPaginatedResult<TItem>> {
  const { prismaModel, include } = config;
  const { where, applicationWhere, search, sorting, pagination } = query;

  const andParts: Record<string, unknown>[] = [where];
  if (hasKeys(applicationWhere)) {
    andParts.push({ [APPLICATION_RELATION]: { is: applicationWhere } });
  }
  const searchArg = buildRecordSearchArg(search);
  if (searchArg) andParts.push(searchArg);

  const finalWhere = andParts.length === 1 ? andParts[0] : { AND: andParts };

  const [total, rawItems] = await Promise.all([
    prismaModel.count({ where: finalWhere }),
    prismaModel.findMany({
      where: finalWhere,
      ...buildRecordSortingArg(sorting),
      ...buildPaginationArgs(pagination),
      include,
    }),
  ]);

  return buildPaginatedResult(rawItems as TItem[], total, pagination.pageSize);
}

export function subtractDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Closed cases stay on the dashboard only while they are still relevant:
 * for 7 days after they were closed, and, for "Closed: Released", until 7
 * days after the expected release date, whichever comes later. This applies to
 * every dashboard query, including one the user has filtered to `Closed`.
 */
export function buildClosedCaseDashboardVisibilityWhere(
  now: Date = new Date(),
): Record<string, unknown> {
  const visibilityStart = subtractDays(now, APPLICATION_RECENT_ACTIVITY_DAYS);

  return {
    OR: [
      { stage: { not: ApplicationStage.CLOSED } },
      { updatedAt: { gte: visibilityStart } },
      {
        AND: [
          { stage: ApplicationStage.CLOSED },
          { subStage: ApplicationSubStage.RELEASED },
          {
            application: {
              expectedReleaseDate: { gte: visibilityStart },
            },
          },
        ],
      },
    ],
  };
}
