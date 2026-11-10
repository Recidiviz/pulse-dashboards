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
import {
  createHousingProvider,
  createHousingProviderUser,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import type { LinkHousingProviderInput } from "../linkHousingProvider";
import {
  LINK_PROVIDER_STATUS,
  linkHousingProvider,
} from "../linkHousingProvider";

const EMAIL = "provider@example.com";
const NAME = "Jane Doe";
const AUTH0_SUB = "auth0|jane-doe";
const OTHER_AUTH0_SUB = "auth0|john-doe";
/** What the Auth0 Action proposes when it has no identifier of its own yet. */
const ACTION_PSEUDONYMIZED_ID = "action-provisional-id";
/** What the split migration carried over from the organization's row. */
const MIGRATED_PSEUDONYMIZED_ID = "migrated-id";
const DECIDED_AT = new Date("2026-01-01T00:00:00.000Z");
const OPTED_OUT_AT = new Date("2026-02-01T00:00:00.000Z");

type ProviderUserOverrides =
  Partial<Prisma.HousingProviderUserUncheckedCreateInput>;

/** A provisioned person who has never signed in, unless overridden. */
function seedProviderUser(overrides: ProviderUserOverrides = {}) {
  return createHousingProviderUser(testPrismaClient, {
    email: EMAIL,
    name: NAME,
    auth0Sub: null,
    pseudonymizedId: null,
    ...overrides,
  });
}

function link(
  overrides: Partial<LinkHousingProviderInput> = {},
  prisma: PrismaClient = testPrismaClient,
) {
  return linkHousingProvider(prisma, {
    email: EMAIL,
    auth0Sub: AUTH0_SUB,
    pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
    ...overrides,
  });
}

function readProviderUser(id: string) {
  return testPrismaClient.housingProviderUser.findUniqueOrThrow({
    where: { id },
  });
}

type LostRaceOptions = {
  /**
   * Columns the request that beat us wrote. Omitting the digest columns is how
   * a winner running a revision older than those columns is represented.
   */
  winner?: ProviderUserOverrides;
  /** The row is gone by the time we re-read it. */
  rowVanishes?: boolean;
};

/**
 * A client for the losing side of a concurrent first login. Reads go to the
 * real database, and the first write reports "no rows matched" — after letting
 * `winner` take the row, which is what made it match nothing. Later writes are
 * real, so what the loser converges is observable on the row afterwards.
 */
function clientLosingTheRace({
  winner,
  rowVanishes = false,
}: LostRaceOptions = {}): PrismaClient {
  let firstWrite = true;

  return {
    housingProviderUser: {
      findFirst: (args: unknown) =>
        testPrismaClient.housingProviderUser.findFirst(args as never),
      findUnique: (args: unknown) =>
        rowVanishes
          ? Promise.resolve(null)
          : testPrismaClient.housingProviderUser.findUnique(args as never),
      updateMany: async (args: unknown) => {
        if (!firstWrite) {
          return testPrismaClient.housingProviderUser.updateMany(args as never);
        }
        firstWrite = false;
        if (winner) {
          await testPrismaClient.housingProviderUser.updateMany({
            where: { email: EMAIL },
            data: winner,
          });
        }
        return { count: 0 };
      },
    },
  } as unknown as PrismaClient;
}

describe("linkHousingProvider", () => {
  test("returns not_found when nobody is provisioned on the address", async () => {
    await expect(link()).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.NOT_FOUND,
    });
  });

  test("a provider with no users links nobody and raises nothing", async () => {
    const housingProvider = await createHousingProvider(testPrismaClient, {
      name: "Empty House",
    });

    await expect(link()).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.NOT_FOUND,
    });
    await expect(
      testPrismaClient.housingProvider.findUnique({
        where: { id: housingProvider.id },
      }),
    ).resolves.not.toBeNull();
    await expect(testPrismaClient.housingProviderUser.count()).resolves.toBe(0);
  });

  test("claims the person's row on first login", async () => {
    const seeded = await seedProviderUser();

    await expect(link()).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.LINKED,
      providerUserId: seeded.id,
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
      email: EMAIL,
      name: NAME,
      intercomSyncedAt: null,
    });

    expect(await readProviderUser(seeded.id)).toMatchObject({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
      linkedAt: expect.any(Date),
      digestEnabled: true,
      digestEnabledAt: expect.any(Date),
    });
  });

  test("a repeat login writes nothing at all", async () => {
    const seeded = await seedProviderUser();
    await link();
    const afterFirstLogin = await readProviderUser(seeded.id);

    await expect(
      link({ pseudonymizedId: "a-later-provisional-id" }),
    ).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
      providerUserId: seeded.id,
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
      email: EMAIL,
      name: NAME,
      intercomSyncedAt: null,
    });

    // updatedAt included: any write at all would move it.
    expect(await readProviderUser(seeded.id)).toEqual(afterFirstLogin);
  });

  test("a migrated identifier survives sign-in untouched and unbackfilled", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
      linkedAt: DECIDED_AT,
      digestEnabled: true,
      digestEnabledAt: DECIDED_AT,
    });

    await expect(link()).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
      providerUserId: seeded.id,
      // The database wins over the Action's payload, so Auth0 and the database
      // cannot drift after a metadata loss.
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
      email: EMAIL,
      name: NAME,
      intercomSyncedAt: null,
    });

    expect(await readProviderUser(seeded.id)).toEqual(seeded);
  });

  test("refuses to rebind a row held by another identity", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: OTHER_AUTH0_SUB,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
      linkedAt: DECIDED_AT,
      digestEnabled: true,
      digestEnabledAt: DECIDED_AT,
    });

    await expect(link()).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.CONFLICT,
      providerUserId: seeded.id,
    });

    // The takeover defense is the row being left exactly as it was.
    expect(await readProviderUser(seeded.id)).toEqual(seeded);
  });

  test("backfills an absent identifier once and never again", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: null,
      linkedAt: DECIDED_AT,
      digestEnabled: true,
      digestEnabledAt: DECIDED_AT,
    });

    await expect(link()).resolves.toMatchObject({
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
    });

    await expect(
      link({ pseudonymizedId: "a-later-provisional-id" }),
    ).resolves.toMatchObject({ pseudonymizedId: ACTION_PSEUDONYMIZED_ID });

    expect(await readProviderUser(seeded.id)).toMatchObject({
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
    });
  });

  test("decides the digest for a row linked before the flag existed", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
    });

    await expect(link()).resolves.toMatchObject({
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
    });

    expect(await readProviderUser(seeded.id)).toMatchObject({
      digestEnabled: true,
      digestEnabledAt: expect.any(Date),
      linkedAt: expect.any(Date),
    });
  });

  test("leaves an existing linkedAt alone while deciding the digest", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
      linkedAt: DECIDED_AT,
    });

    await link();

    expect(await readProviderUser(seeded.id)).toMatchObject({
      linkedAt: DECIDED_AT,
      digestEnabled: true,
    });
  });

  test("never re-subscribes someone who opted out", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
      linkedAt: DECIDED_AT,
      digestEnabled: false,
      digestEnabledAt: OPTED_OUT_AT,
    });

    await link();

    expect(await readProviderUser(seeded.id)).toEqual(seeded);
  });

  test("an opt-out survives a backfill of the identifier", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: null,
      linkedAt: DECIDED_AT,
      digestEnabled: false,
      digestEnabledAt: OPTED_OUT_AT,
    });

    await expect(link()).resolves.toMatchObject({
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
    });

    expect(await readProviderUser(seeded.id)).toMatchObject({
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
      digestEnabled: false,
      digestEnabledAt: OPTED_OUT_AT,
    });
  });
});

describe("concurrent first logins", () => {
  test("one identity signing in twice at once agrees on a single identifier", async () => {
    const seeded = await seedProviderUser();

    const results = await Promise.all([
      link({ pseudonymizedId: "provisional-a" }),
      link({ pseudonymizedId: "provisional-b" }),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      LINK_PROVIDER_STATUS.ALREADY_LINKED,
      LINK_PROVIDER_STATUS.LINKED,
    ]);

    const stored = await readProviderUser(seeded.id);
    expect(stored.auth0Sub).toBe(AUTH0_SUB);
    for (const result of results) {
      expect(result).toMatchObject({ pseudonymizedId: stored.pseudonymizedId });
    }
  });

  test("two identities racing for one row leave exactly one of them linked", async () => {
    const seeded = await seedProviderUser();

    const results = await Promise.all([
      link({ auth0Sub: AUTH0_SUB, pseudonymizedId: "provisional-a" }),
      link({ auth0Sub: OTHER_AUTH0_SUB, pseudonymizedId: "provisional-b" }),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      LINK_PROVIDER_STATUS.CONFLICT,
      LINK_PROVIDER_STATUS.LINKED,
    ]);

    const stored = await readProviderUser(seeded.id);
    expect([AUTH0_SUB, OTHER_AUTH0_SUB]).toContain(stored.auth0Sub);
  });
});

describe("losing a first-login race", () => {
  test("returns conflict when the row is still unclaimed after a failed claim", async () => {
    const seeded = await seedProviderUser();

    await expect(link({}, clientLosingTheRace())).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.CONFLICT,
      providerUserId: seeded.id,
    });
  });

  test("returns conflict when the row disappears before the re-read", async () => {
    const seeded = await seedProviderUser();

    await expect(
      link({}, clientLosingTheRace({ rowVanishes: true })),
    ).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.CONFLICT,
      providerUserId: seeded.id,
    });
  });

  test("returns conflict when a failed backfill leaves no identifier", async () => {
    const seeded = await seedProviderUser({
      auth0Sub: AUTH0_SUB,
      pseudonymizedId: null,
      digestEnabled: true,
      digestEnabledAt: DECIDED_AT,
    });

    await expect(link({}, clientLosingTheRace())).resolves.toEqual({
      status: LINK_PROVIDER_STATUS.CONFLICT,
      providerUserId: seeded.id,
    });
  });

  test("adopts the winner's identifier and decides the digest it left undecided", async () => {
    const seeded = await seedProviderUser();

    await expect(
      link(
        {},
        clientLosingTheRace({
          winner: {
            auth0Sub: AUTH0_SUB,
            pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
          },
        }),
      ),
    ).resolves.toMatchObject({
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
    });

    expect(await readProviderUser(seeded.id)).toMatchObject({
      pseudonymizedId: MIGRATED_PSEUDONYMIZED_ID,
      digestEnabled: true,
      digestEnabledAt: expect.any(Date),
      linkedAt: expect.any(Date),
    });
  });

  test("backfills when the winner claimed the row without an identifier", async () => {
    const seeded = await seedProviderUser();

    await expect(
      link({}, clientLosingTheRace({ winner: { auth0Sub: AUTH0_SUB } })),
    ).resolves.toMatchObject({
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
    });

    expect(await readProviderUser(seeded.id)).toMatchObject({
      pseudonymizedId: ACTION_PSEUDONYMIZED_ID,
      digestEnabled: true,
    });
  });
});
