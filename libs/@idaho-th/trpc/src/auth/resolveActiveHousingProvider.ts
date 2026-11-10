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

import type { PrismaClient } from "~@idaho-th/prisma/client";
import {
  HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
  HOUSING_PROVIDER_REQUIRED_MESSAGE,
} from "~@idaho-th/shared";

type SetActiveHousingProvider = {
  providerId: string;
};
/**
 * The single rejection a provider-scoped request gets when no active
 * organization can be resolved. FORBIDDEN, never UNAUTHORIZED — the host app
 * wires UNAUTHORIZED to logout, so a missing organization would sign the user
 * out instead of showing the selection screen.
 */
export function housingProviderRequiredError() {
  return new TRPCError({
    code: "FORBIDDEN",
    message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
  });
}

/**
 * The rejection a provider-scoped request gets when it names an organization
 * the caller is not assigned to. FORBIDDEN for the same reason as above.
 */
export function housingProviderAccessDeniedError() {
  return new TRPCError({
    code: "FORBIDDEN",
    message: HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
  });
}

/**
 * The person behind a provider request. The split migration moved each
 * organization's pseudonymized id onto its user row, so the id on the Auth0
 * token now identifies a `HousingProviderUser`.
 *
 * A token whose pseudonymized id matches no user row is an identity failure
 * rather than a missing-organization one — the account no longer exists — so it
 * is refused as UNAUTHORIZED, exactly like a token carrying no id at all.
 */
export async function findProviderUserIdByPseudonymizedId(
  prisma: PrismaClient,
  providerPseudonymizedId: string,
): Promise<string> {
  const user = await prisma.housingProviderUser.findUnique({
    where: { pseudonymizedId: providerPseudonymizedId },
    select: { id: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Provider account not found",
    });
  }

  return user.id;
}

/**
 * Whether the organization is assigned to the person, read live from
 * `HousingProviderUserAssignment` so a revoked assignment stops working on the
 * caller's next request.
 */
export async function isAssignedProvider(
  prisma: PrismaClient,
  providerUserId: string,
  requestedProviderId: string,
): Promise<boolean> {
  const assignment = await prisma.housingProviderUserAssignment.findUnique({
    where: {
      providerUserId_providerId: {
        providerUserId,
        providerId: requestedProviderId,
      },
    },
    select: { id: true },
  });

  return assignment !== null;
}

/**
 * The organization the person last acted as, or null if none is stored. The
 * stored preference is not checked against their assignments — callers verify
 * it with `isAssignedProvider` before trusting it.
 */
export async function findLastActiveProviderId(
  prisma: PrismaClient,
  providerUserId: string,
): Promise<string | null> {
  const providerUser = await prisma.housingProviderUser.findUnique({
    where: { id: providerUserId },
    select: { lastActiveProviderId: true },
  });

  return providerUser?.lastActiveProviderId ?? null;
}

/**
 * The one and only writer of the preference column, invoked when the caller
 * picks from the selection screen.
 *
 * The assignment check lives in the `where` clause rather than in a read
 * followed by an `if`, so an assignment revoked between the two cannot slip a
 * write through: no matching row means no update and no rows touched.
 */
export async function setActiveHousingProvider(
  prisma: PrismaClient,
  providerUserId: string,
  providerId: string,
): Promise<SetActiveHousingProvider> {
  const { count } = await prisma.housingProviderUser.updateMany({
    where: { id: providerUserId, assignments: { some: { providerId } } },
    data: { lastActiveProviderId: providerId },
  });

  if (count === 0) {
    // An ordinary FORBIDDEN, never the dedicated organization-required
    // constant: the client routes that constant to the selection screen, and
    // the caller is already there. Picking an organization you do not manage is
    // a cross-organization denial and has to stay visible as one.
    //
    // One message for both "not assigned" and "no such organization", so the
    // refusal does not reveal which organizations exist.
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Provider not available",
    });
  }

  return { providerId };
}

/**
 * What the caller resolves to on their own. A lone assignment is the answer and
 * is persisted as the preference. With several, only a stored preference whose
 * assignment still lives is honoured; otherwise nothing is chosen for them —
 * the selection screen's normal state, not a failure.
 */
export async function deriveActiveProviderId(
  prisma: PrismaClient,
  providerUserId: string,
  assignments: { provider: { id: string } }[],
): Promise<string | null> {
  const lastActiveProviderId = await findLastActiveProviderId(
    prisma,
    providerUserId,
  );

  if (assignments.length === 1) {
    const [{ provider }] = assignments;
    if (lastActiveProviderId !== provider.id) {
      await setActiveHousingProvider(prisma, providerUserId, provider.id);
    }
    return provider.id;
  }

  const isStillAssigned = assignments.some(
    ({ provider }) => provider.id === lastActiveProviderId,
  );

  return isStillAssigned ? lastActiveProviderId : null;
}
