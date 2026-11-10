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

import {
  HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
  HOUSING_PROVIDER_REQUIRED_MESSAGE,
} from "~@idaho-th/shared";
import {
  providerProcedure,
  providerProcedureBase,
  router,
} from "~@idaho-th/trpc/init";
import {
  createProviderContext,
  createStaffContext,
  type TestContext,
} from "~@idaho-th/trpc/test/caller";
import {
  createHousingProvider,
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  seedProviderUserWithHousingProviders,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { parseRequestedProviderId } from "../parseRequestedProviderId";

/**
 * Two routes that do nothing but report the context the real middleware built,
 * so a caller observes the resolution outcome directly. They use the production
 * procedures, which keeps this a test of the chokepoint itself rather than of
 * any one feature route.
 */
const providerRouter = router({
  activeHousingProvider: providerProcedure.query(({ ctx }) => ({
    providerUserId: ctx.providerUserId,
    providerId: ctx.providerId,
  })),
  person: providerProcedureBase.query(({ ctx }) => ({
    providerPseudonymizedId: ctx.providerPseudonymizedId,
    providerUserId: ctx.providerUserId,
  })),
});

const providerCaller = (overrides: Partial<TestContext> = {}) =>
  providerRouter.createCaller(createProviderContext(overrides));

const staffCaller = () => providerRouter.createCaller(createStaffContext());

/** The rejection a provider request gets when no organization resolves. */
const HOUSING_PROVIDER_REQUIRED = {
  code: "FORBIDDEN",
  message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
};

/** The rejection a request naming an unassigned organization gets instead. */
const HOUSING_PROVIDER_ACCESS_DENIED = {
  code: "FORBIDDEN",
  message: HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
};

const rememberHousingProvider = (providerUserId: string, providerId: string) =>
  testPrismaClient.housingProviderUser.update({
    where: { id: providerUserId },
    data: { lastActiveProviderId: providerId },
  });

const revokeAssignment = (providerUserId: string, providerId: string) =>
  testPrismaClient.housingProviderUserAssignment.delete({
    where: { providerUserId_providerId: { providerUserId, providerId } },
  });

describe("parseRequestedProviderId", () => {
  test("a single header value is the requested provider, trimmed", () => {
    expect(parseRequestedProviderId("  org-1  ")).toBe("org-1");
  });

  test("an absent, blank or repeated header requests no provider", () => {
    expect(parseRequestedProviderId(undefined)).toBeUndefined();
    expect(parseRequestedProviderId("   ")).toBeUndefined();
    expect(parseRequestedProviderId(["org-1", "org-2"])).toBeUndefined();
  });
});

describe("the active provider a provider request resolves to", () => {
  test("a named provider the caller is assigned to is used", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}],
      });
    const [acting, other] = housingProviders;

    const result = await providerCaller({
      requestedProviderId: acting.id,
    }).activeHousingProvider();

    expect(result.providerId).toBe(acting.id);
    expect(result.providerId).not.toBe(other.id);
    expect(result.providerUserId).toBe(user.id);
  });

  test("a named provider the caller is not assigned to is refused", async () => {
    await seedProviderUserWithHousingProviders(testPrismaClient);
    const someoneElses = await createHousingProvider(testPrismaClient);

    await expect(
      providerCaller({
        requestedProviderId: someoneElses.id,
      }).activeHousingProvider(),
    ).rejects.toMatchObject(HOUSING_PROVIDER_ACCESS_DENIED);
  });

  test("a named unassigned provider is refused even when a preference would otherwise resolve", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient);
    await rememberHousingProvider(user.id, housingProviders[0].id);
    const someoneElses = await createHousingProvider(testPrismaClient);

    await expect(
      providerCaller({
        requestedProviderId: someoneElses.id,
      }).activeHousingProvider(),
    ).rejects.toMatchObject(HOUSING_PROVIDER_ACCESS_DENIED);
  });

  test("with no header, a stored preference whose assignment is live is used", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}],
      });
    const [other, preferred] = housingProviders;
    await rememberHousingProvider(user.id, preferred.id);

    const result = await providerCaller().activeHousingProvider();

    expect(result.providerId).toBe(preferred.id);
    expect(result.providerId).not.toBe(other.id);
  });

  test("a stored preference whose assignment was revoked falls through to the lone assignment left, which replaces it", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}],
      });
    const [stale, remaining] = housingProviders;
    await rememberHousingProvider(user.id, stale.id);
    await revokeAssignment(user.id, stale.id);

    const result = await providerCaller().activeHousingProvider();

    expect(result.providerId).toBe(remaining.id);
    expect(result.providerId).not.toBe(stale.id);

    const stored = await testPrismaClient.housingProviderUser.findUniqueOrThrow(
      {
        where: { id: user.id },
        select: { lastActiveProviderId: true },
      },
    );
    expect(stored.lastActiveProviderId).toBe(remaining.id);
  });

  test("a stale preference with several assignments left is refused rather than honored", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}, {}],
      });
    const [stale] = housingProviders;
    await rememberHousingProvider(user.id, stale.id);
    await revokeAssignment(user.id, stale.id);

    await expect(
      providerCaller().activeHousingProvider(),
    ).rejects.toMatchObject(HOUSING_PROVIDER_REQUIRED);
  });

  test("with no header and no preference, a single assignment is used", async () => {
    const { housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient);

    const result = await providerCaller().activeHousingProvider();

    expect(result.providerId).toBe(housingProviders[0].id);
  });

  test("several assignments with nothing naming one is refused", async () => {
    await seedProviderUserWithHousingProviders(testPrismaClient, {
      housingProviders: [{}, {}],
    });

    await expect(
      providerCaller().activeHousingProvider(),
    ).rejects.toMatchObject(HOUSING_PROVIDER_REQUIRED);
  });

  test("a caller with no assignments is refused, never handed another provider", async () => {
    await seedProviderUserWithHousingProviders(testPrismaClient, {
      housingProviders: [],
    });
    const colleague = await createHousingProviderUser(testPrismaClient, {
      pseudonymizedId: uniqueId("provider"),
    });
    const theirHousingProvider = await createHousingProvider(testPrismaClient);
    await createHousingProviderUserAssignment(testPrismaClient, {
      providerUserId: colleague.id,
      providerId: theirHousingProvider.id,
    });

    await expect(
      providerCaller().activeHousingProvider(),
    ).rejects.toMatchObject(HOUSING_PROVIDER_REQUIRED);
    await expect(
      providerCaller({
        requestedProviderId: theirHousingProvider.id,
      }).activeHousingProvider(),
    ).rejects.toMatchObject(HOUSING_PROVIDER_ACCESS_DENIED);
  });

  test("revoking an assignment takes effect on the next request", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}],
      });
    const [acting] = housingProviders;
    const caller = providerCaller({ requestedProviderId: acting.id });

    await expect(caller.activeHousingProvider()).resolves.toMatchObject({
      providerId: acting.id,
    });

    await revokeAssignment(user.id, acting.id);

    await expect(caller.activeHousingProvider()).rejects.toMatchObject(
      HOUSING_PROVIDER_ACCESS_DENIED,
    );
  });

  test("a pseudonymized id matching no provider user is refused without crashing", async () => {
    await expect(
      providerCaller().activeHousingProvider(),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("a staff caller cannot reach a provider route", async () => {
    await expect(staffCaller().activeHousingProvider()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Provider access required",
    });
  });
});

describe("the provider procedure that permits no active provider", () => {
  test("a caller with no assignments still resolves to their own user row", async () => {
    const { user } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      {
        housingProviders: [],
      },
    );

    await expect(providerCaller().person()).resolves.toEqual({
      providerPseudonymizedId: user.pseudonymizedId,
      providerUserId: user.id,
    });
  });

  test("a caller with several assignments is not asked to name one", async () => {
    const { user } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      {
        housingProviders: [{}, {}],
      },
    );

    await expect(providerCaller().person()).resolves.toMatchObject({
      providerUserId: user.id,
    });
  });

  test("a pseudonymized id matching no provider user is still refused", async () => {
    await expect(providerCaller().person()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
