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

// Read-back helpers shared by service tests: assertions must come from the
// database, not from the fixture that seeded it. A read that needs extra
// `include`s or a feature-specific shape stays local to its test file.

import type { PrismaClient } from "~@idaho-th/prisma/client";

export function readHousingApplication(
  prismaClient: PrismaClient,
  applicationId: string,
) {
  return prismaClient.housingApplication.findUniqueOrThrow({
    where: { id: applicationId },
  });
}

export function readStaffApplication(
  prismaClient: PrismaClient,
  applicationId: string,
) {
  return prismaClient.staffHousingApplication.findUniqueOrThrow({
    where: { applicationId },
  });
}

export function readProviderApplication(
  prismaClient: PrismaClient,
  providerApplicationId: string,
) {
  return prismaClient.providerHousingApplication.findUniqueOrThrow({
    where: { id: providerApplicationId },
  });
}

export function readTimelineEvents(
  prismaClient: PrismaClient,
  applicationId: string,
) {
  // Events created in one transaction share a createdAt, so callers must not
  // depend on the order of this list.
  return prismaClient.housingApplicationTimelineEvent.findMany({
    where: { applicationId },
  });
}

/** The application's preferred provider ids, in the order staff ranked them. */
export async function readPreferredProviderIds(
  prismaClient: PrismaClient,
  applicationId: string,
) {
  const rows = await prismaClient.preferredHousingProvider.findMany({
    where: { applicationId },
    orderBy: { rank: "asc" },
    select: { providerId: true },
  });
  return rows.map((row) => row.providerId);
}
