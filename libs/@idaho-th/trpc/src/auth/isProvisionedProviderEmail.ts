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

/**
 * Widest select: the fields `linkHousingProvider` needs to claim a row and hand
 * the Intercom sync a contact snapshot. Never use it to answer a boolean — see
 * {@link isProvisionedProviderEmail}.
 *
 * A provider signs in as a *person*, so every column here lives on
 * `HousingProviderUser`. The organization carries none of them.
 */
export const PROVISIONED_PROVIDER_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  auth0Sub: true,
  pseudonymizedId: true,
  intercomSyncedAt: true,
  digestEnabled: true,
  digestEnabledAt: true,
  linkedAt: true,
} as const satisfies Prisma.HousingProviderUserSelect;

export type ProvisionedProviderUser = Prisma.HousingProviderUserGetPayload<{
  select: typeof PROVISIONED_PROVIDER_USER_SELECT;
}>;

/**
 * Narrowest select that can answer "does a row exist?". Kept separate from
 * {@link PROVISIONED_PROVIDER_USER_SELECT} so the unauthenticated path cannot
 * drift into reading PII.
 */
export const PROVIDER_USER_EXISTENCE_SELECT = {
  id: true,
} as const satisfies Prisma.HousingProviderUserSelect;

/** Returns the comparable form of `email`, or undefined if it cannot be one. */
function normalizeProviderEmail(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : undefined;
}

/**
 * Case-insensitive address lookup.
 *
 * `findFirst`, never `findUnique`: `HousingProviderUser.email` is unique by a
 * raw `lower("email")` expression index, which Prisma cannot express and so
 * does not model. There is therefore no unique `where` to look up by, and the
 * case-insensitive filter is what makes this match the index's semantics.
 */
export async function findHousingProviderUserByEmail(
  prisma: PrismaClient,
  email: string,
): Promise<ProvisionedProviderUser | undefined> {
  const normalizedEmail = normalizeProviderEmail(email);
  if (!normalizedEmail) {
    return undefined;
  }

  const providerUser = await prisma.housingProviderUser.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    select: PROVISIONED_PROVIDER_USER_SELECT,
  });

  return providerUser ?? undefined;
}

/**
 * Existence only, and deliberately not built on
 * {@link findHousingProviderUserByEmail}. The public `checkSignInEmail`
 * procedure reaches this with no authentication at all, so it selects nothing
 * but the id — an unauthenticated caller probing addresses should never cause a
 * provider's name or email to be read out of the database, let alone held in
 * memory.
 *
 * Provisioning is a property of a *person*, so an organization with no users
 * provisions nobody; that is a valid state and not an error.
 */
export async function isProvisionedProviderEmail(
  prisma: PrismaClient,
  email: string,
): Promise<boolean> {
  const normalizedEmail = normalizeProviderEmail(email);
  if (!normalizedEmail) return false;

  const match = await prisma.housingProviderUser.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: PROVIDER_USER_EXISTENCE_SELECT,
  });
  return match !== null;
}
