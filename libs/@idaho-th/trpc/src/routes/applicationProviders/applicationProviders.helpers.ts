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
import { requireStaffOwnsApplication } from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";

import {
  mapProviderApplicationRow,
  sortApplicationProviders,
} from "./applicationProviders.mapper";
import { staffApplicationProvidersSelect } from "./applicationProviders.selects";
import type {
  GetApplicationProvidersResult,
  ProviderApplicationFilters,
  StaffApplicationProvidersRow,
} from "./applicationProviders.types";

export async function findStaffApplicationProviders(
  client: PrismaClient,
  applicationId: string,
  filters?: ProviderApplicationFilters,
): Promise<StaffApplicationProvidersRow | null> {
  return client.housingApplication.findFirst({
    where: { id: applicationId },
    select: staffApplicationProvidersSelect(filters),
  });
}

export function resolveStaffApplicationProviders(
  context: StaffApplicationProvidersRow | null,
  staffPseudonymizedId: string,
): GetApplicationProvidersResult {
  requireStaffOwnsApplication<StaffApplicationProvidersRow>(
    context,
    staffPseudonymizedId,
  );

  return {
    applicationId: context.id,
    providers: sortApplicationProviders(
      context.providerApplications.map(mapProviderApplicationRow),
    ),
  };
}
