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

import { TEST_PROVIDER_PSEUDONYMIZED_ID, uniqueId } from "./constants";

type HousingProviderUserInput =
  Partial<Prisma.HousingProviderUserUncheckedCreateInput>;

/**
 * The person who signs in to the provider portal, independent of any
 * organization — an assignment is what connects the two.
 *
 * Defaults to TEST_PROVIDER_PSEUDONYMIZED_ID, the identity providerCaller()
 * acts as, so the common case needs no override. `pseudonymizedId` is unique,
 * so a second user in the same test must pass its own.
 */
export function createHousingProviderUser(
  prismaClient: PrismaClient,
  overrides: HousingProviderUserInput = {},
) {
  return prismaClient.housingProviderUser.create({
    data: {
      name: "Jane Doe",
      // Unique by a raw lower("email") index, so it is never a fixed literal.
      email: `${uniqueId("provider")}@example.com`,
      pseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      ...overrides,
    },
  });
}

// Both sides are the whole point of the row, so neither is ever defaulted.
type HousingProviderUserAssignmentInput = Pick<
  Prisma.HousingProviderUserAssignmentUncheckedCreateInput,
  "providerUserId" | "providerId"
> &
  Partial<Prisma.HousingProviderUserAssignmentUncheckedCreateInput>;

/**
 * Grants a user access to an organization. The provider middleware resolves the
 * active organization from these rows, so a provider caller with no assignment
 * is refused.
 */
export function createHousingProviderUserAssignment(
  prismaClient: PrismaClient,
  {
    providerUserId,
    providerId,
    ...overrides
  }: HousingProviderUserAssignmentInput,
) {
  return prismaClient.housingProviderUserAssignment.create({
    data: {
      providerUserId,
      providerId,
      ...overrides,
    },
  });
}
