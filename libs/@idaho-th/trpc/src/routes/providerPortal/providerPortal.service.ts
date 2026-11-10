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

import { TRPCError } from "@trpc/server";

import type { Prisma, PrismaClient } from "~@idaho-th/prisma/client";
import { HOUSING_PROVIDER_NAME_TAKEN_MESSAGE } from "~@idaho-th/trpc/routes/providerPortal/providerPortal.constants";
import { findProviderById } from "~@idaho-th/trpc/routes/providerPortal/providerPortal.helpers";
import { mapProviderDetailsFromRow } from "~@idaho-th/trpc/routes/providerPortal/providerPortal.mapper";
import type {
  UpdateHousingProviderInput,
  UpdateProviderLocationInput,
  UpdateProviderProfileInput,
} from "~@idaho-th/trpc/routes/providerPortal/providerPortal.schema";
import {
  PROVIDER_CORE_SELECT,
  PROVIDER_DETAILS_SELECT,
  PROVIDER_USER_CONTACT_SELECT,
  ProviderCoreRow,
} from "~@idaho-th/trpc/routes/providerPortal/providerPortal.selects";

/** The caller, as the provider middleware resolved them. */
export type ProviderPortalActor = {
  /** Verified active HousingProvider.id — what every organization read is scoped to. */
  providerId: string;
  /** HousingProviderUser.id — the person, shared across their organizations. */
  providerUserId: string;
};

async function findProviderOrThrow<S extends Prisma.HousingProviderSelect>(
  prisma: PrismaClient,
  providerId: string,
  select: S,
) {
  const provider = await findProviderById<S>(prisma, providerId, select);
  if (!provider) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
  }
  return provider;
}

export async function getCurrentProvider(
  prisma: PrismaClient,
  providerId: string,
): Promise<ProviderCoreRow> {
  return findProviderOrThrow(prisma, providerId, PROVIDER_CORE_SELECT);
}

export async function getProviderDetails(
  prisma: PrismaClient,
  { providerId, providerUserId }: ProviderPortalActor,
) {
  const [housingProvider, user] = await Promise.all([
    findProviderOrThrow(prisma, providerId, PROVIDER_DETAILS_SELECT),
    prisma.housingProviderUser.findUnique({
      where: { id: providerUserId },
      select: PROVIDER_USER_CONTACT_SELECT,
    }),
  ]);

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
  }

  return mapProviderDetailsFromRow(housingProvider, user);
}

const UNIQUE_CONSTRAINT_ERROR_CODE = "P2002";

/**
 * `HousingProvider.name` is unique, so a rename onto a name another
 * organization holds comes back as a constraint violation. The driver adapter
 * wraps Prisma's error type, so the code is read structurally rather than
 * through `instanceof`.
 *
 * The rename touches no other unique column, which is why the code alone is
 * enough to identify the collision.
 */
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_CONSTRAINT_ERROR_CODE
  );
}

/**
 * Renames the organization the caller is acting as. `providerId` comes from the
 * verified context and never from the request body, so a person managing two
 * organizations cannot rename the one they are not acting as.
 */
export async function updateHousingProvider(
  prisma: PrismaClient,
  providerId: string,
  input: UpdateHousingProviderInput,
): Promise<void> {
  // Named individually so the name is the only writable column.
  const data: Prisma.HousingProviderUpdateManyMutationInput = {
    name: input.housingProviderName,
  };

  let count: number;
  try {
    ({ count } = await prisma.housingProvider.updateMany({
      where: { id: providerId },
      data,
    }));
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: HOUSING_PROVIDER_NAME_TAKEN_MESSAGE,
      });
    }
    throw error;
  }

  if (count === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
  }
}

/**
 * Writes the caller's own name and phone to their user row, where they are
 * shared across every organization they manage. Deliberately not scoped to an
 * organization: there is one profile per person, not one per organization.
 */
export async function updateProviderProfile(
  prisma: PrismaClient,
  providerUserId: string,
  input: UpdateProviderProfileInput,
): Promise<void> {
  // Named individually so only these two are writable. An omitted field is
  // undefined (Prisma skips it); the nullable phone is cleared with null.
  const data: Prisma.HousingProviderUserUpdateManyMutationInput = {
    name: input.contactName,
    contactPhone: input.contactPhone,
  };

  const { count } = await prisma.housingProviderUser.updateMany({
    where: { id: providerUserId },
    data,
  });

  if (count === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
  }
}

export async function updateProviderLocation(
  prisma: PrismaClient,
  providerId: string,
  input: UpdateProviderLocationInput,
): Promise<void> {
  const { locationId, acceptedGender, ...rest } = input;

  const data: Prisma.HousingProviderLocationUpdateManyMutationInput = {
    streetAddress: rest.streetAddress,
    city: rest.city,
    state: rest.state,
    zip: rest.zip,
    district: rest.district,
    // A scalar list needs the explicit `set` form to replace the list.
    acceptedGenders: acceptedGender ? { set: [acceptedGender] } : undefined,
    acceptsRiders: rest.acceptsRiders,
    acceptsSexOffenders: rest.acceptsSexOffenders,
    acceptsViolentCriminals: rest.acceptsViolentCriminals,
    faithBased: rest.faithBased,
  };

  // Ownership is in the filter, not in a check after the read: a location id
  // from another organization matches nothing rather than being updated.
  const { count } = await prisma.housingProviderLocation.updateMany({
    where: { id: locationId, providerId },
    data,
  });

  if (count === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Location not found" });
  }
}
