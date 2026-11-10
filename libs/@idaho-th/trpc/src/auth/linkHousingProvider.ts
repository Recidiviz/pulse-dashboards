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
import { findHousingProviderUserByEmail } from "~@idaho-th/trpc/auth/isProvisionedProviderEmail";

export type LinkHousingProviderInput = {
  email: string;
  auth0Sub: string;
  pseudonymizedId: string;
};

export type LinkHousingProviderSuccess = {
  /**
   * The `HousingProviderUser` that was claimed — a person, never an
   * organization. Organization access is a separate concern, resolved per
   * request from that person's assignments.
   */
  providerUserId: string;
  pseudonymizedId: string;
  email: string;
  name: string;
  intercomSyncedAt: Date | null;
};

export const LINK_PROVIDER_STATUS = {
  /** First successful claim of an unlinked provider user row. */
  LINKED: "linked",
  /** Row was already bound to this same `auth0Sub` (including race losers). */
  ALREADY_LINKED: "already_linked",
  /** Row is bound to a *different* `auth0Sub` — refuse, never overwrite. */
  CONFLICT: "conflict",
  /** No provisioned provider user for that email. */
  NOT_FOUND: "not_found",
} as const;

export type LinkHousingProviderResult =
  | ({
      status: typeof LINK_PROVIDER_STATUS.LINKED;
    } & LinkHousingProviderSuccess)
  | ({
      status: typeof LINK_PROVIDER_STATUS.ALREADY_LINKED;
    } & LinkHousingProviderSuccess)
  | { status: typeof LINK_PROVIDER_STATUS.CONFLICT; providerUserId: string }
  | { status: typeof LINK_PROVIDER_STATUS.NOT_FOUND };

/**
 * Backfills `pseudonymizedId` for a row whose `auth0Sub` is already verified and
 * whose `pseudonymizedId` is known to be null. Skips a redundant read of the row
 * we already fetched.
 *
 * Deliberately writes nothing but `pseudonymizedId`. A single `updateMany`
 * cannot express a per-column `WHERE`, so folding the digest decision in here
 * would subscribe on a precondition (`pseudonymizedId: null`) that says nothing
 * about the digest, overwriting a deliberate opt-out. The flag is decided
 * exclusively by {@link enableProviderDigest}.
 *
 * The split migration moved each organization's identifier onto its new user
 * row rather than regenerating it, so a migrated user arrives here with a
 * non-null `pseudonymizedId` and this never runs for them.
 */
async function backfillPseudonymizedId(
  prisma: PrismaClient,
  providerUserId: string,
  auth0Sub: string,
  fallbackPseudonymizedId: string,
): Promise<string | undefined> {
  const backfilled = await prisma.housingProviderUser.updateMany({
    where: { id: providerUserId, auth0Sub, pseudonymizedId: null },
    data: { pseudonymizedId: fallbackPseudonymizedId },
  });

  if (backfilled.count === 1) {
    return fallbackPseudonymizedId;
  }

  const refreshed = await prisma.housingProviderUser.findUnique({
    where: { id: providerUserId },
    select: { pseudonymizedId: true },
  });

  return refreshed?.pseudonymizedId ?? undefined;
}

/**
 * True while the digest flag has never been decided for this row. A non-null
 * `digestEnabledAt` means someone decided — on first login, by the migration's
 * backfill, or by a later opt-out — and a login must never overrule that.
 */
function isDigestUndecided(providerUser: {
  digestEnabled: boolean;
  digestEnabledAt: Date | null;
}): boolean {
  return !providerUser.digestEnabled && !providerUser.digestEnabledAt;
}

/**
 * Converges a row linked before this column existed: rows whose `auth0Sub` was
 * written by code that predates `digestEnabled`, or by the old revision while
 * the migration was still running.
 *
 * Guarded three ways, each load-bearing:
 * - `auth0Sub` as well as `id`, so the statement itself can only ever touch the
 *   row belonging to the caller we just verified.
 * - `digestEnabled: false`, so a re-login costs no write.
 * - `digestEnabledAt: null`, so this only ever *decides* an undecided flag. A
 *   provider who was enabled and later opted out has a non-null timestamp, and
 *   must not be silently re-subscribed by their next login.
 *
 * A zero-row result is therefore benign by construction — the flag was already
 * decided, whether by a concurrent login or by a deliberate opt-out — which is
 * why the count is not inspected, unlike in the sibling helpers where it
 * distinguishes a lost race.
 */
async function enableProviderDigest(
  prisma: PrismaClient,
  providerUser: { id: string; linkedAt: Date | null },
  auth0Sub: string,
): Promise<void> {
  const now = new Date();

  await prisma.housingProviderUser.updateMany({
    where: {
      id: providerUser.id,
      auth0Sub,
      digestEnabled: false,
      digestEnabledAt: null,
    },
    data: {
      digestEnabled: true,
      digestEnabledAt: now,
      ...(providerUser.linkedAt ? {} : { linkedAt: now }),
    },
  });
}

/**
 * Re-reads a row after a first-login race and returns the canonical
 * `pseudonymizedId`, backfilling only when the winner linked without one.
 *
 * The winner decides the digest flag atomically as part of its claim, so the
 * converge here fires only for a row claimed by a revision that predates the
 * column — the same case {@link enableProviderDigest} exists for, resolved off
 * the read this function already performs.
 */
async function resolveCanonicalPseudonymizedIdAfterRace(
  prisma: PrismaClient,
  providerUserId: string,
  auth0Sub: string,
  fallbackPseudonymizedId: string,
): Promise<string | undefined> {
  const row = await prisma.housingProviderUser.findUnique({
    where: { id: providerUserId },
    select: {
      auth0Sub: true,
      pseudonymizedId: true,
      digestEnabled: true,
      digestEnabledAt: true,
      linkedAt: true,
    },
  });

  if (!row || row.auth0Sub !== auth0Sub) {
    return undefined;
  }

  const pseudonymizedId =
    row.pseudonymizedId ??
    (await backfillPseudonymizedId(
      prisma,
      providerUserId,
      auth0Sub,
      fallbackPseudonymizedId,
    ));

  if (pseudonymizedId && isDigestUndecided(row)) {
    await enableProviderDigest(
      prisma,
      { id: providerUserId, linkedAt: row.linkedAt },
      auth0Sub,
    );
  }

  return pseudonymizedId;
}

/** Shapes a success result from the row we already fetched. */
function toLinkSuccess(
  status:
    | typeof LINK_PROVIDER_STATUS.LINKED
    | typeof LINK_PROVIDER_STATUS.ALREADY_LINKED,
  providerUser: {
    id: string;
    email: string;
    name: string;
    intercomSyncedAt: Date | null;
  },
  pseudonymizedId: string,
): Extract<LinkHousingProviderResult, { status: typeof status }> {
  return {
    status,
    providerUserId: providerUser.id,
    pseudonymizedId,
    email: providerUser.email,
    name: providerUser.name,
    intercomSyncedAt: providerUser.intercomSyncedAt,
  };
}

/**
 * Links an Auth0 identity to a provisioned `HousingProviderUser` row,
 * idempotently and safe against concurrent first-logins.
 *
 * A provider signs in as a person, so the row claimed here is the person's.
 * Which organizations that person may act as is a separate, per-request
 * decision made from their assignments — this function grants no access.
 *
 * The linkage is a write-once binding:
 * - If the user has no `auth0Sub` yet, it is claimed atomically via a
 *   conditional `updateMany` guarded on `auth0Sub: null`. Two concurrent first
 *   logins race on that guard; exactly one wins.
 * - If it is already bound to the *same* `auth0Sub`, this is a no-op success
 *   (`already_linked`) — re-runs and the losing side of a race land here.
 * - If it is already bound to a *different* `auth0Sub`, we refuse
 *   (`conflict`) rather than overwrite. Blindly overwriting `auth0Sub` would let
 *   a forged/replayed webhook re-point a provider account at an attacker's
 *   identity — an account-takeover vector.
 *
 * On success, returns the canonical `pseudonymizedId` from the database. The
 * Action must use this value for JWT claims and Auth0 `app_metadata`, not the
 * request payload, so Auth0 and the DB cannot drift after metadata loss. The
 * split migration carried each organization's identifier onto its user row, so
 * an existing provider signs in on their migrated identifier with no backfill
 * and no change to it.
 *
 * `pseudonymizedId` is only written on the initial claim (or one-time backfill
 * when null), never overwritten once set.
 *
 * Also decides `digestEnabled`/`digestEnabledAt` on first login, and converges
 * rows linked before those columns existed — see {@link enableProviderDigest}.
 */
export async function linkHousingProvider(
  prisma: PrismaClient,
  input: LinkHousingProviderInput,
): Promise<LinkHousingProviderResult> {
  const providerUser = await findHousingProviderUserByEmail(
    prisma,
    input.email,
  );

  if (!providerUser) {
    return { status: LINK_PROVIDER_STATUS.NOT_FOUND };
  }

  if (providerUser.auth0Sub) {
    if (providerUser.auth0Sub !== input.auth0Sub) {
      return {
        status: LINK_PROVIDER_STATUS.CONFLICT,
        providerUserId: providerUser.id,
      };
    }

    if (providerUser.pseudonymizedId) {
      if (isDigestUndecided(providerUser)) {
        await enableProviderDigest(prisma, providerUser, input.auth0Sub);
      }

      return toLinkSuccess(
        LINK_PROVIDER_STATUS.ALREADY_LINKED,
        providerUser,
        providerUser.pseudonymizedId,
      );
    }

    const pseudonymizedId = await backfillPseudonymizedId(
      prisma,
      providerUser.id,
      input.auth0Sub,
      input.pseudonymizedId,
    );

    if (!pseudonymizedId) {
      return {
        status: LINK_PROVIDER_STATUS.CONFLICT,
        providerUserId: providerUser.id,
      };
    }

    if (isDigestUndecided(providerUser)) {
      await enableProviderDigest(prisma, providerUser, input.auth0Sub);
    }

    return toLinkSuccess(
      LINK_PROVIDER_STATUS.ALREADY_LINKED,
      providerUser,
      pseudonymizedId,
    );
  }

  // Atomically claim the row only if it is still unlinked. Guards against two
  // concurrent first-logins both passing the read above.
  const claimedAt = new Date();
  const claimed = await prisma.housingProviderUser.updateMany({
    where: { id: providerUser.id, auth0Sub: null },
    data: {
      auth0Sub: input.auth0Sub,
      pseudonymizedId: input.pseudonymizedId,
      linkedAt: claimedAt,
      digestEnabled: true,
      digestEnabledAt: claimedAt,
    },
  });

  if (claimed.count === 1) {
    return toLinkSuccess(
      LINK_PROVIDER_STATUS.LINKED,
      providerUser,
      input.pseudonymizedId,
    );
  }

  // Lost the race: another request linked it first. Re-read fresh state before
  // resolving the canonical pseudonymizedId.
  const pseudonymizedId = await resolveCanonicalPseudonymizedIdAfterRace(
    prisma,
    providerUser.id,
    input.auth0Sub,
    input.pseudonymizedId,
  );

  if (!pseudonymizedId) {
    return {
      status: LINK_PROVIDER_STATUS.CONFLICT,
      providerUserId: providerUser.id,
    };
  }

  return toLinkSuccess(
    LINK_PROVIDER_STATUS.ALREADY_LINKED,
    providerUser,
    pseudonymizedId,
  );
}
