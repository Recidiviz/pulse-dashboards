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

import { Prisma } from "~@idaho-th/prisma/client";

// Preferred providers live in the PreferredHousingProvider table, not in
// HousingApplication.formData: the foreign keys reject an unknown provider on
// save, and deleting a provider cascades instead of leaving a stale id behind.
// The client still sends and receives them as formData.preferredProviders, so
// writers split them off here and the detail read puts them back.

const PREFERRED_PROVIDER_FK = "PreferredHousingProvider_providerId_fkey";

/** Reads an application's preferred providers in the order staff ranked them. */
export const PREFERRED_PROVIDERS_SELECT = {
  orderBy: { rank: "asc" },
  select: { provider: { select: { id: true, name: true } } },
} satisfies Prisma.HousingApplication$preferredProvidersArgs;

/** Removes preferredProviders from formData, returning the ids separately. */
export function splitPreferredProviders<T extends Record<string, unknown>>(
  formData: T,
): {
  formData: Omit<T, "preferredProviders">;
  preferredProviderIds: string[];
} {
  const { preferredProviders, ...rest } = formData;
  const preferredProviderIds = Array.isArray(preferredProviders)
    ? preferredProviders.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : [];
  return { formData: rest, preferredProviderIds };
}

/** Nested write creating one row per id, ranked by array position. */
export function preferredProvidersCreate(
  providerIds: readonly string[],
): Prisma.PreferredHousingProviderCreateNestedManyWithoutApplicationInput {
  return {
    create: providerIds.map((providerId, rank) => ({ providerId, rank })),
  };
}

/** Nested update write that replaces every existing row with the given ids. */
export function preferredProvidersReplace(
  providerIds: readonly string[],
): Prisma.PreferredHousingProviderUpdateManyWithoutApplicationNestedInput {
  return { deleteMany: {}, ...preferredProvidersCreate(providerIds) };
}

/** Puts the stored ids back into formData in the shape the client sends. */
export function withPreferredProviders(
  formData: Prisma.JsonValue,
  preferredProviders: string[],
): Prisma.JsonValue {
  if (
    typeof formData !== "object" ||
    formData === null ||
    Array.isArray(formData)
  ) {
    return formData;
  }
  return { ...formData, preferredProviders };
}

/** True when a write was rejected because a preferred provider id is unknown. */
export function isPreferredProviderFkViolation(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2003"
  ) {
    return false;
  }
  // The constraint name is nested in driver-adapter metadata whose shape
  // varies by adapter, so search for it as text rather than by path.
  return JSON.stringify(error.meta ?? {}).includes(PREFERRED_PROVIDER_FK);
}
