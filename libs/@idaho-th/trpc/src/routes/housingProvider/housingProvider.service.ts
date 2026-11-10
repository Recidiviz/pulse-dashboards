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

import type { PrismaClient } from "~@idaho-th/prisma/client";
import { deriveActiveProviderId } from "~@idaho-th/trpc/auth/resolveActiveHousingProvider";
import {
  ASSIGNED_HOUSING_PROVIDER_ORDER_BY,
  ASSIGNED_HOUSING_PROVIDER_SELECT,
} from "~@idaho-th/trpc/routes/housingProvider/housingProvider.selects";
import type {
  HousingProvider,
  HousingProviderRecord,
  ResolvedHousingProviders,
} from "~@idaho-th/trpc/routes/housingProvider/housingProvider.types";

function toHousingProvider({
  id,
  name,
  _count,
  locations,
}: HousingProviderRecord): HousingProvider {
  return {
    id,
    name,
    locationsCount: _count.locations,
    districts: locations.map(({ district }) => district),
  };
}

/**
 * The single authoritative answer to "which organizations do I manage, and
 * which am I acting as".
 *
 * A lone organization is persisted as the preference the first time it is
 * derived, so the write happens once rather than on every cold load.
 */
export async function resolveHousingProviders(
  prisma: PrismaClient,
  providerUserId: string,
): Promise<ResolvedHousingProviders> {
  // Built from the caller's assignment rows, so an organization they do not
  // manage cannot appear even if the join were widened later.
  const assignments = await prisma.housingProviderUserAssignment.findMany({
    where: { providerUserId },
    select: ASSIGNED_HOUSING_PROVIDER_SELECT,
    orderBy: ASSIGNED_HOUSING_PROVIDER_ORDER_BY,
  });

  return {
    housingProviders: assignments.map(({ provider }) =>
      toHousingProvider(provider),
    ),
    activeProviderId: await deriveActiveProviderId(
      prisma,
      providerUserId,
      assignments,
    ),
  };
}
