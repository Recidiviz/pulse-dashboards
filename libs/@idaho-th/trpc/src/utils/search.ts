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

import { type SearchParams } from "~@idaho-th/shared/types";

/**
 * Filters a client-supplied search object down to an explicit allowlist of
 * Prisma field names before it reaches a `where` clause. `search`'s keys are
 * attacker-controlled, so any key not in `allowedFields` is silently dropped
 * rather than passed through to Prisma.
 */
export function buildSearchArg(
  search: NonNullable<SearchParams>,
  allowedFields: readonly string[],
): NonNullable<SearchParams> | undefined {
  const filtered = Object.fromEntries(
    Object.entries(search).filter(([field]) => allowedFields.includes(field)),
  );

  return Object.keys(filtered).length > 0 ? filtered : undefined;
}
