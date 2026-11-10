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
  HOUSING_APPLICATION_NOT_FOUND,
  throwHousingApplicationNotFound,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  buildApplicationWhereForProvider,
  buildApplicationWhereForStaff,
  requireProviderOwnedApplication,
  requireStaffOwnsApplication,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";

import {
  providerApplicationDetailSelect,
  staffApplicationDetailInclude,
} from "./applicationDetail.selects";
import type {
  DbClient,
  ProviderApplicationDetailRow,
  StaffApplicationDetailRow,
} from "./applicationDetail.types";

export async function findStaffApplicationDetail(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<StaffApplicationDetailRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForStaff(applicationId, staffPseudonymizedId),
    include: staffApplicationDetailInclude(staffPseudonymizedId),
  });
}

export function requireStaffApplicationDetail(
  context: StaffApplicationDetailRow | null,
  staffPseudonymizedId: string,
): StaffApplicationDetailRow {
  requireStaffOwnsApplication<StaffApplicationDetailRow>(
    context,
    staffPseudonymizedId,
  );

  return context;
}

export async function getStaffApplicationDetail(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<StaffApplicationDetailRow> {
  return requireStaffApplicationDetail(
    await findStaffApplicationDetail(
      client,
      applicationId,
      staffPseudonymizedId,
    ),
    staffPseudonymizedId,
  );
}

export async function findProviderApplicationDetail(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderApplicationDetailRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: providerApplicationDetailSelect(providerId),
  });
}

export function requireProviderApplicationDetail(
  context: ProviderApplicationDetailRow | null,
): ProviderApplicationDetailRow {
  if (context != null) {
    requireProviderOwnedApplication(context.providerApplications);
    return context;
  }

  throwHousingApplicationNotFound(
    HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
  );
}
