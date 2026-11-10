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
import {
  createHousingProvider,
  createHousingProviderUser,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  findHousingProviderUserByEmail,
  isProvisionedProviderEmail,
  PROVIDER_USER_EXISTENCE_SELECT,
} from "../isProvisionedProviderEmail";

const PROVIDER_EMAIL = "provider@example.com";

/** The same address as stored, differently cased, and surrounded by whitespace. */
const EQUIVALENT_ADDRESSES = [
  PROVIDER_EMAIL,
  "Provider@Example.COM",
  `  ${PROVIDER_EMAIL}  `,
];

type FindFirstArgs = Parameters<
  typeof testPrismaClient.housingProviderUser.findFirst
>[0];

/**
 * Records the query the subject issues while still running it against the test
 * database, so the columns the unauthenticated path reads can be asserted
 * without stubbing away the result. Spying on the shared client itself is not
 * an option — its delegates are lazy getters that do not survive a restore.
 */
function recordingPrisma() {
  const findFirst = vi.fn((args: FindFirstArgs) =>
    testPrismaClient.housingProviderUser.findFirst(args),
  );
  return {
    prisma: { housingProviderUser: { findFirst } } as unknown as PrismaClient,
    findFirst,
  };
}

describe("isProvisionedProviderEmail", () => {
  test("provisions the person, however their address is cased or padded", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
    });

    for (const email of EQUIVALENT_ADDRESSES) {
      // eslint-disable-next-line no-await-in-loop -- one lookup at a time
      await expect(
        isProvisionedProviderEmail(testPrismaClient, email),
      ).resolves.toBe(true);
    }
  });

  test("returns false for an address nobody is provisioned on", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
    });

    await expect(
      isProvisionedProviderEmail(testPrismaClient, "unknown@example.com"),
    ).resolves.toBe(false);
  });

  test("provisions a person who has not signed in yet", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
      auth0Sub: null,
      pseudonymizedId: null,
    });

    await expect(
      isProvisionedProviderEmail(testPrismaClient, PROVIDER_EMAIL),
    ).resolves.toBe(true);
  });

  test("provisions a person with no provider assigned to them yet", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
    });

    // Sign-in is a fact about the person. Which organizations they may act as
    // is decided per request, and is not this check's business.
    await expect(
      isProvisionedProviderEmail(testPrismaClient, PROVIDER_EMAIL),
    ).resolves.toBe(true);
  });

  test("a provider with no users provisions nobody and raises nothing", async () => {
    await createHousingProvider(testPrismaClient, { name: "Empty House" });

    await expect(
      isProvisionedProviderEmail(testPrismaClient, PROVIDER_EMAIL),
    ).resolves.toBe(false);
  });

  test("reads the identifier and nothing else", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
    });
    const { prisma, findFirst } = recordingPrisma();

    await expect(
      isProvisionedProviderEmail(prisma, PROVIDER_EMAIL),
    ).resolves.toBe(true);

    // Reached unauthenticated, so it must never load a person's name or email.
    expect(Object.keys(PROVIDER_USER_EXISTENCE_SELECT)).toEqual(["id"]);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ select: PROVIDER_USER_EXISTENCE_SELECT }),
    );
  });
});

describe("findHousingProviderUserByEmail", () => {
  test("finds the person by exact, differently-cased and padded address", async () => {
    const providerUser = await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
      name: "Jane Doe",
    });

    for (const email of EQUIVALENT_ADDRESSES) {
      // eslint-disable-next-line no-await-in-loop -- one lookup at a time
      await expect(
        findHousingProviderUserByEmail(testPrismaClient, email),
      ).resolves.toMatchObject({
        id: providerUser.id,
        email: PROVIDER_EMAIL,
        name: "Jane Doe",
      });
    }
  });

  test("returns undefined for an unknown address", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: PROVIDER_EMAIL,
    });

    await expect(
      findHousingProviderUserByEmail(testPrismaClient, "unknown@example.com"),
    ).resolves.toBeUndefined();
  });

  test("finds the one person behind an address shared across providers", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        user: { email: PROVIDER_EMAIL },
        housingProviders: [{}, {}],
      });
    expect(housingProviders).toHaveLength(2);

    await expect(
      findHousingProviderUserByEmail(testPrismaClient, PROVIDER_EMAIL),
    ).resolves.toMatchObject({ id: user.id });
  });
});

describe("address probing", () => {
  // An address with no "@" can never match a stored one, so the guard is what
  // stops a probe from reaching the database at all.
  test.each([
    [
      "findHousingProviderUserByEmail",
      findHousingProviderUserByEmail,
      undefined,
    ],
    ["isProvisionedProviderEmail", isProvisionedProviderEmail, false],
  ])("%s short-circuits without querying", async (_name, subject, expected) => {
    const { prisma, findFirst } = recordingPrisma();

    await expect(subject(prisma, "not-an-address")).resolves.toBe(expected);
    expect(findFirst).not.toHaveBeenCalled();
  });
});
