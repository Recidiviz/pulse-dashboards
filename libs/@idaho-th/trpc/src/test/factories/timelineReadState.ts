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

import type { Prisma, PrismaClient } from "~@idaho-th/prisma/client";

// The organization is the whole point of a provider read state — a read by one
// colleague counts for all of them — so it is never defaulted. `providerUserId`
// is left to an override: it records who read, and is nullable because an
// organization with no users has nobody to attribute a read to.
type ProviderTimelineReadStateInput = Pick<
  Prisma.ProviderTimelineReadStateUncheckedCreateInput,
  "applicationId" | "providerId"
> &
  Partial<Prisma.ProviderTimelineReadStateUncheckedCreateInput>;

export function createProviderTimelineReadState(
  prismaClient: PrismaClient,
  { applicationId, providerId, ...overrides }: ProviderTimelineReadStateInput,
) {
  return prismaClient.providerTimelineReadState.create({
    data: {
      applicationId,
      providerId,
      ...overrides,
    },
  });
}

// The viewer is the whole point of a read state, so it is never defaulted.
type StaffTimelineReadStateInput = Pick<
  Prisma.StaffTimelineReadStateUncheckedCreateInput,
  "applicationId" | "staffPseudonymizedId"
> &
  Partial<Prisma.StaffTimelineReadStateUncheckedCreateInput>;

export function createStaffTimelineReadState(
  prismaClient: PrismaClient,
  {
    applicationId,
    staffPseudonymizedId,
    ...overrides
  }: StaffTimelineReadStateInput,
) {
  return prismaClient.staffTimelineReadState.create({
    data: {
      applicationId,
      staffPseudonymizedId,
      ...overrides,
    },
  });
}
