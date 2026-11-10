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

import type { Prisma } from "~@idaho-th/prisma/client";

/**
 * Everything the selection screen needs, and nothing else. It renders a name,
 * a location count and the districts, and sends back an id; any further
 * column would be an organization detail leaking into an
 * endpoint that runs before the caller has chosen an organization at all.
 *
 * Location rows contribute a count and distinct district names only — never an
 * address. Both come from the one query, so there is no per-provider lookup.
 */
export const HOUSING_PROVIDER_SELECT = {
  id: true,
  name: true,
  _count: { select: { locations: true } },
  locations: {
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" },
  },
} as const satisfies Prisma.HousingProviderSelect;

/**
 * The caller's own assignments, joined to the organization each one grants. The
 * list is built from assignment rows rather than from `HousingProvider`, so an
 * organization the caller is not assigned to can never appear in it.
 */
export const ASSIGNED_HOUSING_PROVIDER_SELECT = {
  provider: { select: HOUSING_PROVIDER_SELECT },
} as const satisfies Prisma.HousingProviderUserAssignmentSelect;

/** Alphabetical, so the picker does not reshuffle between loads. */
export const ASSIGNED_HOUSING_PROVIDER_ORDER_BY = {
  provider: { name: "asc" },
} as const satisfies Prisma.HousingProviderUserAssignmentOrderByWithRelationInput;
