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

import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Shared Zod schema for optional server-side sorting input.
export const sortingSchema = z
  .object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  })
  .optional();

export type SortingParams = z.infer<typeof sortingSchema>;

/**
 * `sorting.field` is client-controlled, so it must be checked against an
 * explicit allowlist of Prisma field names before reaching `orderBy` —
 * mirrors buildSearchArg's allowlisting of `search` keys.
 */
export function buildSortingArg(
  sorting: SortingParams,
  allowedFields: readonly string[],
): {
  orderBy: Record<string, "asc" | "desc">;
} {
  if (!sorting) return { orderBy: { createdAt: "desc" } };
  if (!allowedFields.includes(sorting.field)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "sorting.field is not an allowed sort field",
    });
  }
  return { orderBy: { [sorting.field]: sorting.direction } };
}
