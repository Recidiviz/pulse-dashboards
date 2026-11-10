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

import { HOUSING_PROVIDER_REQUIRED_MESSAGE } from "~@idaho-th/shared";
import { providerCaller, staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createHousingProviderLocationsInDistricts,
  createHousingProviderUser,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const UNKNOWN_PROVIDER_ID = "00000000-0000-0000-0000-000000000000";

/** A colleague at an unrelated organization; never the caller. */
function seedOtherProviderUser(housingProviderName: string) {
  return seedProviderUserWithHousingProviders(testPrismaClient, {
    user: { pseudonymizedId: "other-provider-pseudonymized-id" },
    housingProviders: [{ name: housingProviderName }],
  });
}

function setStoredPreference(providerUserId: string, providerId: string) {
  return testPrismaClient.housingProviderUser.update({
    where: { id: providerUserId },
    data: { lastActiveProviderId: providerId },
  });
}

function readStoredPreference(providerUserId: string) {
  return testPrismaClient.housingProviderUser
    .findUniqueOrThrow({
      where: { id: providerUserId },
      select: { lastActiveProviderId: true },
    })
    .then((user) => user.lastActiveProviderId);
}

describe("housingProviderRouter", () => {
  describe("resolve", () => {
    it("returns an empty list and no active provider for a user with no assignments", async () => {
      await createHousingProviderUser(testPrismaClient);
      await seedOtherProviderUser("Zephyr House");

      await expect(providerCaller().housingProvider.resolve()).resolves.toEqual(
        { housingProviders: [], activeProviderId: null },
      );
    });

    it("omits providers the caller is not assigned to", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient, {
          housingProviders: [
            { name: "Beacon House" },
            { name: "Anchor House" },
          ],
        });
      const other = await seedOtherProviderUser("Zephyr House");

      const resolved = await providerCaller().housingProvider.resolve();

      expect(resolved.housingProviders).toEqual([
        {
          id: housingProviders[1].id,
          name: "Anchor House",
          locationsCount: 0,
          districts: [],
        },
        {
          id: housingProviders[0].id,
          name: "Beacon House",
          locationsCount: 0,
          districts: [],
        },
      ]);
      expect(resolved.housingProviders).not.toContainEqual(
        expect.objectContaining({ id: other.housingProviders[0].id }),
      );
      expect(user.lastActiveProviderId).toBeNull();
    });

    it("returns each provider's location count and distinct districts, A to Z", async () => {
      const { housingProviders } = await seedProviderUserWithHousingProviders(
        testPrismaClient,
        {
          housingProviders: [
            { name: "Anchor House" },
            { name: "Beacon House" },
          ],
        },
      );
      await createHousingProviderLocationsInDistricts(
        testPrismaClient,
        housingProviders[0].id,
        ["District 3", "District 1", "District 3"],
      );
      await createHousingProviderLocationsInDistricts(
        testPrismaClient,
        housingProviders[1].id,
        ["District 2"],
      );

      const resolved = await providerCaller().housingProvider.resolve();

      expect(resolved.housingProviders).toEqual([
        {
          id: housingProviders[0].id,
          name: "Anchor House",
          locationsCount: 3,
          districts: ["District 1", "District 3"],
        },
        {
          id: housingProviders[1].id,
          name: "Beacon House",
          locationsCount: 1,
          districts: ["District 2"],
        },
      ]);
    });

    it("does not count or list locations of providers the caller is not assigned to", async () => {
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{ name: "Anchor House" }],
      });
      const other = await seedOtherProviderUser("Zephyr House");
      await createHousingProviderLocationsInDistricts(
        testPrismaClient,
        other.housingProviders[0].id,
        ["District 9"],
      );

      const resolved = await providerCaller().housingProvider.resolve();

      expect(resolved.housingProviders).toEqual([
        expect.objectContaining({ locationsCount: 0, districts: [] }),
      ]);
    });

    it("has no active provider when several are assigned and none was chosen", async () => {
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}],
      });

      await expect(
        providerCaller().housingProvider.resolve(),
      ).resolves.toMatchObject({ activeProviderId: null });
    });

    it("resolves the stored preference while its assignment exists", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient, {
          housingProviders: [{}, {}],
        });
      await setStoredPreference(user.id, housingProviders[1].id);

      await expect(
        providerCaller().housingProvider.resolve(),
      ).resolves.toMatchObject({ activeProviderId: housingProviders[1].id });
    });

    it("derives a lone assignment as the active provider and stores it", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient);

      await expect(
        providerCaller().housingProvider.resolve(),
      ).resolves.toMatchObject({ activeProviderId: housingProviders[0].id });
      await expect(readStoredPreference(user.id)).resolves.toBe(
        housingProviders[0].id,
      );
    });

    it("overrides a stale preference with the lone assignment", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient);
      const other = await seedOtherProviderUser("Zephyr House");
      await setStoredPreference(user.id, other.housingProviders[0].id);

      await expect(
        providerCaller().housingProvider.resolve(),
      ).resolves.toMatchObject({ activeProviderId: housingProviders[0].id });
    });

    it("reports a preference whose assignment was deleted as unresolved, and leaves the preference in place", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient, {
          housingProviders: [{}, {}, {}],
        });
      const revoked = housingProviders[2];
      await setStoredPreference(user.id, revoked.id);
      await testPrismaClient.housingProviderUserAssignment.delete({
        where: {
          providerUserId_providerId: {
            providerUserId: user.id,
            providerId: revoked.id,
          },
        },
      });

      const resolved = await providerCaller().housingProvider.resolve();

      expect(resolved.activeProviderId).toBeNull();
      expect(resolved.housingProviders).not.toContainEqual(
        expect.objectContaining({ id: revoked.id }),
      );
      await expect(readStoredPreference(user.id)).resolves.toBe(revoked.id);
    });

    it("refuses a staff caller", async () => {
      await expect(
        staffCaller().housingProvider.resolve(),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("refuses a token whose pseudonymized id matches no provider user", async () => {
      await expect(
        providerCaller().housingProvider.resolve(),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("setActive", () => {
    it("persists the choice, so the next resolve returns it", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient, {
          housingProviders: [{}, {}],
        });

      await expect(
        providerCaller().housingProvider.setActive({
          providerId: housingProviders[1].id,
        }),
      ).resolves.toEqual({ providerId: housingProviders[1].id });

      await expect(readStoredPreference(user.id)).resolves.toBe(
        housingProviders[1].id,
      );
      await expect(
        providerCaller().housingProvider.resolve(),
      ).resolves.toMatchObject({ activeProviderId: housingProviders[1].id });
    });

    it("overwrites a preference whose assignment was revoked", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient, {
          housingProviders: [{}, {}, {}],
        });
      const revoked = housingProviders[2];
      await setStoredPreference(user.id, revoked.id);
      await testPrismaClient.housingProviderUserAssignment.delete({
        where: {
          providerUserId_providerId: {
            providerUserId: user.id,
            providerId: revoked.id,
          },
        },
      });

      await providerCaller().housingProvider.setActive({
        providerId: housingProviders[0].id,
      });

      await expect(readStoredPreference(user.id)).resolves.toBe(
        housingProviders[0].id,
      );
    });

    it("refuses a provider the caller is not assigned to, and stores nothing", async () => {
      const { user } =
        await seedProviderUserWithHousingProviders(testPrismaClient);
      const other = await seedOtherProviderUser("Zephyr House");

      await expect(
        providerCaller().housingProvider.setActive({
          providerId: other.housingProviders[0].id,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(readStoredPreference(user.id)).resolves.toBeNull();
      await expect(readStoredPreference(other.user.id)).resolves.toBeNull();
    });

    it("refuses a provider that does not exist", async () => {
      await seedProviderUserWithHousingProviders(testPrismaClient);

      await expect(
        providerCaller().housingProvider.setActive({
          providerId: UNKNOWN_PROVIDER_ID,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("refuses with an ordinary message, not the provider-required constant that bounces the client to the picker", async () => {
      const other = await seedOtherProviderUser("Zephyr House");
      await seedProviderUserWithHousingProviders(testPrismaClient);

      await expect(
        providerCaller().housingProvider.setActive({
          providerId: other.housingProviders[0].id,
        }),
      ).rejects.not.toMatchObject({
        message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
      });
    });

    it("works for a caller with no active provider resolved", async () => {
      const { user, housingProviders } =
        await seedProviderUserWithHousingProviders(testPrismaClient, {
          housingProviders: [{}, {}],
        });

      await expect(
        providerCaller().housingProvider.setActive({
          providerId: housingProviders[0].id,
        }),
      ).resolves.toEqual({ providerId: housingProviders[0].id });
      await expect(readStoredPreference(user.id)).resolves.toBe(
        housingProviders[0].id,
      );
    });

    it("rejects an unknown key rather than letting it reach the update", async () => {
      await seedProviderUserWithHousingProviders(testPrismaClient);

      await expect(
        providerCaller().housingProvider.setActive({
          providerId: UNKNOWN_PROVIDER_ID,
          lastActiveProviderId: UNKNOWN_PROVIDER_ID,
        } as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("refuses a staff caller", async () => {
      await expect(
        staffCaller().housingProvider.setActive({
          providerId: UNKNOWN_PROVIDER_ID,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
