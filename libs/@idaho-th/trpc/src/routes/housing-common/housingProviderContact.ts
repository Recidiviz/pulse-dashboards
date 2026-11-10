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
 * The one organization contact staff are shown, resolved in one place.
 *
 * **A display convenience, never an authorization or ownership fact.** An
 * organization has any number of `HousingProviderUser` rows — several, or none
 * — and this picks one of them to put on screen. It says nothing about who may
 * act for the organization; assignments do that, and the provider middleware is
 * the only thing that reads them.
 *
 * "First assigned" means the earliest `HousingProviderUserAssignment`, tie-
 * broken by `providerUserId` so the answer is stable across queries and
 * replicas: the CSV seed creates assignments in bulk and they can share a
 * `createdAt`, so ordering on the timestamp alone is not deterministic.
 */
export const HOUSING_PROVIDER_CONTACT_SELECT = {
  userAssignments: {
    orderBy: [{ createdAt: "asc" }, { providerUserId: "asc" }],
    take: 1,
    select: {
      user: { select: { name: true, email: true, contactPhone: true } },
    },
  },
} as const satisfies Prisma.HousingProviderSelect;

export type HousingProviderContactRow = Prisma.HousingProviderGetPayload<{
  select: typeof HOUSING_PROVIDER_CONTACT_SELECT;
}>;

export type HousingProviderContact = {
  contactName: string;
  email: string;
  contactPhone: string | null;
};

/** `null` for an organization with no users — a normal state, not an error. */
export function toHousingProviderContact(
  housingProvider: HousingProviderContactRow,
): HousingProviderContact | null {
  const user = housingProvider.userAssignments[0]?.user;
  if (!user) {
    return null;
  }
  return {
    contactName: user.name,
    email: user.email,
    contactPhone: user.contactPhone,
  };
}
