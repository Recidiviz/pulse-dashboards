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

//Shared Zod schema for cursor-based pagination input.
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).default(7),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export type CursorPaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};

export function buildPaginationArgs(params: PaginationParams): {
  take: number;
  skip?: number;
  cursor?: { id: string };
} {
  return {
    take: params.pageSize + 1,
    ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
  };
}

export function buildPaginatedResult<T extends { id: string }>(
  rawItems: T[],
  total: number,
  pageSize: number,
): CursorPaginatedResult<T> {
  const hasNextPage = rawItems.length > pageSize;
  const items = hasNextPage ? rawItems.slice(0, pageSize) : rawItems;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor, total };
}
