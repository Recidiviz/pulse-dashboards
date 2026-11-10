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
  HOUSING_PROVIDER_REQUIRED_MESSAGE,
  PROVIDER_CONTACT_MAX_LENGTH,
} from "~@idaho-th/shared";
import { HOUSING_PROVIDER_NAME_TAKEN_MESSAGE } from "~@idaho-th/trpc/routes/providerPortal";
import { providerCaller, staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createHousingProvider,
  createHousingProviderLocation,
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const VALID_LOCATION_UPDATE = {
  streetAddress: "456 Oak Ave",
  city: "Meridian",
  state: "ID",
  zip: "83642",
  district: "D3",
  acceptedGender: "FEMALE",
  acceptsRiders: true,
  acceptsSexOffenders: true,
  acceptsViolentCriminals: false,
  faithBased: true,
} as const;

describe("providerPortalRouter", () => {
  // One person managing two organizations. Every call below names the one it
  // acts as, which is what the portal has to scope its reads and writes to.
  let housingProviderId: string;
  let otherHousingProviderId: string;
  let userEmail: string;

  beforeEach(async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        user: { name: "Jane Doe", contactPhone: "555-0100" },
        housingProviders: [
          { name: "Acme Housing" },
          { name: "Other Provider" },
        ],
      });
    housingProviderId = housingProviders[0].id;
    otherHousingProviderId = housingProviders[1].id;
    userEmail = user.email;
  });

  function portal(providerId?: string) {
    return providerCaller({
      requestedProviderId: providerId ?? housingProviderId,
    }).housingApplication;
  }

  describe("getCurrentProvider", () => {
    it("returns the acting provider's own id and name", async () => {
      await expect(portal().getCurrentProvider()).resolves.toEqual({
        id: housingProviderId,
        name: "Acme Housing",
      });
    });

    it("returns the other provider when the caller switches to it", async () => {
      await expect(
        portal(otherHousingProviderId).getCurrentProvider(),
      ).resolves.toEqual({
        id: otherHousingProviderId,
        name: "Other Provider",
      });
    });

    it("refuses a caller with no assignments rather than returning a provider", async () => {
      const unassigned = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-unassigned",
        name: "John Doe",
      });

      await expect(
        providerCaller({
          providerPseudonymizedId: unassigned.pseudonymizedId ?? undefined,
        }).housingApplication.getCurrentProvider(),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
      });
    });
  });

  describe("getProviderDetails", () => {
    it("returns the acting provider's locations and the caller's own contact info", async () => {
      const location = await createHousingProviderLocation(testPrismaClient, {
        providerId: housingProviderId,
      });

      await expect(portal().getProviderDetails()).resolves.toEqual({
        housingProviderName: "Acme Housing",
        contactName: "Jane Doe",
        contactEmail: userEmail,
        contactPhone: "555-0100",
        locations: [expect.objectContaining({ id: location.id })],
      });
    });

    it("omits the other provider's locations", async () => {
      const own = await createHousingProviderLocation(testPrismaClient, {
        providerId: housingProviderId,
      });
      const other = await createHousingProviderLocation(testPrismaClient, {
        providerId: otherHousingProviderId,
      });

      const details = await portal().getProviderDetails();

      const locationIds = details.locations.map((location) => location.id);
      expect(locationIds).not.toContain(other.id);
      expect(locationIds).toEqual([own.id]);
    });
  });

  describe("updateHousingProvider", () => {
    it("renames only the provider the caller is acting as", async () => {
      await portal().updateHousingProvider({
        housingProviderName: "Renamed Housing",
      });

      // The other organization is the one that proves the scoping: a missing
      // filter would rename whichever row the query happened to reach.
      await expect(
        portal(otherHousingProviderId).getProviderDetails(),
      ).resolves.toMatchObject({ housingProviderName: "Other Provider" });
      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        housingProviderName: "Renamed Housing",
      });
    });

    it("renames the second provider when the caller switches to it, leaving the first alone", async () => {
      await portal(otherHousingProviderId).updateHousingProvider({
        housingProviderName: "Renamed Other",
      });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        housingProviderName: "Acme Housing",
      });
      await expect(
        portal(otherHousingProviderId).getProviderDetails(),
      ).resolves.toMatchObject({ housingProviderName: "Renamed Other" });
    });

    it("leaves the caller's personal details untouched", async () => {
      await portal().updateHousingProvider({
        housingProviderName: "Renamed Housing",
      });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactName: "Jane Doe",
        contactPhone: "555-0100",
      });
    });

    describe("duplicate name", () => {
      it("reports a conflict with an actionable message, not a database error", async () => {
        await expect(
          portal().updateHousingProvider({
            housingProviderName: "Other Provider",
          }),
        ).rejects.toMatchObject({
          code: "CONFLICT",
          message: HOUSING_PROVIDER_NAME_TAKEN_MESSAGE,
        });
      });

      it("treats a name differing only by case or spacing as taken", async () => {
        await expect(
          portal().updateHousingProvider({
            housingProviderName: "  OTHER provider ",
          }),
        ).rejects.toMatchObject({
          code: "CONFLICT",
          message: HOUSING_PROVIDER_NAME_TAKEN_MESSAGE,
        });
      });

      it("never surfaces a raw constraint violation", async () => {
        // The mutation resolves to void, so map success to undefined: that
        // makes a silent success fail the assertions below rather than
        // type-erroring here.
        const error = await portal()
          .updateHousingProvider({ housingProviderName: "Other Provider" })
          .then(() => undefined)
          .catch((caught: { code?: string; message?: string }) => caught);

        expect(error).toMatchObject({
          message: HOUSING_PROVIDER_NAME_TAKEN_MESSAGE,
        });
        expect(error?.message).not.toMatch(/P2002|[Uu]nique constraint/);
      });

      it("changes neither provider's name", async () => {
        await portal()
          .updateHousingProvider({ housingProviderName: "Other Provider" })
          .catch(() => undefined);

        await expect(
          portal(otherHousingProviderId).getProviderDetails(),
        ).resolves.toMatchObject({ housingProviderName: "Other Provider" });
        await expect(portal().getProviderDetails()).resolves.toMatchObject({
          housingProviderName: "Acme Housing",
        });
      });

      it("accepts a rename of a provider to the name it already has", async () => {
        await expect(
          portal().updateHousingProvider({
            housingProviderName: "Acme Housing",
          }),
        ).resolves.toBeUndefined();
      });

      it("collides with a provider the caller does not manage", async () => {
        await createHousingProvider(testPrismaClient, {
          name: "Unrelated Housing",
        });

        await expect(
          portal().updateHousingProvider({
            housingProviderName: "Unrelated Housing",
          }),
        ).rejects.toMatchObject({
          code: "CONFLICT",
          message: HOUSING_PROVIDER_NAME_TAKEN_MESSAGE,
        });
      });
    });

    it("rejects an empty provider name", async () => {
      await expect(
        portal().updateHousingProvider({ housingProviderName: "   " }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("caps the provider name at its maximum length after trimming", async () => {
      const maxLength = PROVIDER_CONTACT_MAX_LENGTH.housingProviderName;

      await expect(
        portal().updateHousingProvider({
          housingProviderName: ` ${"a".repeat(maxLength)} `,
        }),
      ).resolves.toBeUndefined();
      await expect(
        portal().updateHousingProvider({
          housingProviderName: "b".repeat(maxLength + 1),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a request with no fields", async () => {
      await expect(
        (
          portal().updateHousingProvider as unknown as (
            input: Record<string, unknown>,
          ) => Promise<unknown>
        )({}),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a provider id in the body, so the record is never named by the caller", async () => {
      await expect(
        (
          portal().updateHousingProvider as unknown as (
            input: Record<string, unknown>,
          ) => Promise<unknown>
        )({
          housingProviderName: "Renamed Housing",
          providerId: otherHousingProviderId,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        portal(otherHousingProviderId).getProviderDetails(),
      ).resolves.toMatchObject({ housingProviderName: "Other Provider" });
    });

    it("refuses a caller with no assignments rather than writing anything", async () => {
      const unassigned = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-unassigned",
        name: "John Doe",
      });

      await expect(
        providerCaller({
          providerPseudonymizedId: unassigned.pseudonymizedId ?? undefined,
        }).housingApplication.updateHousingProvider({
          housingProviderName: "Hijacked Housing",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
      });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        housingProviderName: "Acme Housing",
      });
      await expect(
        portal(otherHousingProviderId).getProviderDetails(),
      ).resolves.toMatchObject({ housingProviderName: "Other Provider" });
    });
  });

  describe("updateProviderProfile", () => {
    it("applies personal details across every provider the person manages", async () => {
      await portal().updateProviderProfile({ contactName: "John Doe" });

      await expect(
        portal(otherHousingProviderId).getProviderDetails(),
      ).resolves.toMatchObject({ contactName: "John Doe" });
      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactName: "John Doe",
      });
    });

    it("updates only the field sent and leaves the others untouched", async () => {
      await portal().updateProviderProfile({ contactName: "John Doe" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        housingProviderName: "Acme Housing",
        contactName: "John Doe",
        contactEmail: userEmail,
        contactPhone: "555-0100",
      });
    });

    it("leaves every provider's name untouched", async () => {
      await portal().updateProviderProfile({
        contactName: "John Doe",
        contactPhone: "(208) 555-0199",
      });

      await expect(
        portal(otherHousingProviderId).getProviderDetails(),
      ).resolves.toMatchObject({ housingProviderName: "Other Provider" });
      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        housingProviderName: "Acme Housing",
      });
    });

    it("does not touch a colleague at the same provider", async () => {
      const colleague = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-colleague",
        name: "Jane Doe",
        contactPhone: "555-0199",
      });
      await createHousingProviderUserAssignment(testPrismaClient, {
        providerUserId: colleague.id,
        providerId: housingProviderId,
      });

      await portal().updateProviderProfile({ contactName: "John Doe" });

      await expect(
        testPrismaClient.housingProviderUser.findUnique({
          where: { id: colleague.id },
          select: { name: true, contactPhone: true },
        }),
      ).resolves.toEqual({ name: "Jane Doe", contactPhone: "555-0199" });
    });

    it("validates a phone number and preserves its typed format", async () => {
      await portal().updateProviderProfile({ contactPhone: "(208) 555-0199" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactPhone: "(208) 555-0199",
      });
    });

    it("rejects a phone number that isn't a valid 10-digit number", async () => {
      await expect(
        portal().updateProviderProfile({ contactPhone: "123" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("stores an empty phone as null", async () => {
      await portal().updateProviderProfile({ contactPhone: "" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactPhone: null,
      });
    });

    it("rejects an empty personal name rather than clearing a required column", async () => {
      await expect(
        portal().updateProviderProfile({ contactName: "   " }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactName: "Jane Doe",
      });
    });

    it("caps the personal name at its maximum length after trimming", async () => {
      const maxLength = PROVIDER_CONTACT_MAX_LENGTH.contactName;

      await expect(
        portal().updateProviderProfile({
          contactName: ` ${"a".repeat(maxLength)} `,
        }),
      ).resolves.toBeUndefined();
      await expect(
        portal().updateProviderProfile({
          contactName: "a".repeat(maxLength + 1),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a request with no fields", async () => {
      await expect(portal().updateProviderProfile({})).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("rejects a provider name, which belongs to the other mutation", async () => {
      await expect(
        (
          portal().updateProviderProfile as unknown as (
            input: Record<string, unknown>,
          ) => Promise<unknown>
        )({ housingProviderName: "Renamed Housing" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        housingProviderName: "Acme Housing",
      });
    });

    it("rejects an email field, since it is unreachable from the input schema", async () => {
      await expect(
        (
          portal().updateProviderProfile as unknown as (
            input: Record<string, unknown>,
          ) => Promise<unknown>
        )({ contactEmail: "hacker@example.com" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactEmail: userEmail,
      });
    });

    it("refuses a caller whose pseudonymized id matches no user", async () => {
      await expect(
        providerCaller({
          providerPseudonymizedId: "provider-does-not-exist",
        }).housingApplication.updateProviderProfile({
          contactName: "John Doe",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

      await expect(portal().getProviderDetails()).resolves.toMatchObject({
        contactName: "Jane Doe",
      });
    });
  });

  describe("updateProviderLocation", () => {
    async function seedOwnLocation(
      overrides: Record<string, unknown> = {},
      providerId: string = housingProviderId,
    ) {
      return createHousingProviderLocation(testPrismaClient, {
        providerId,
        ...overrides,
      });
    }

    it("writes every editable column, including the population list", async () => {
      const location = await seedOwnLocation();

      await portal().updateProviderLocation({
        locationId: location.id,
        ...VALID_LOCATION_UPDATE,
      });

      const updated = await testPrismaClient.housingProviderLocation.findUnique(
        { where: { id: location.id } },
      );
      expect(updated).toMatchObject({
        streetAddress: VALID_LOCATION_UPDATE.streetAddress,
        city: VALID_LOCATION_UPDATE.city,
        state: VALID_LOCATION_UPDATE.state,
        zip: VALID_LOCATION_UPDATE.zip,
        district: VALID_LOCATION_UPDATE.district,
        acceptedGenders: ["FEMALE"],
        acceptsRiders: true,
        acceptsSexOffenders: true,
        acceptsViolentCriminals: false,
        faithBased: true,
      });
    });

    it("writes only the field sent and leaves the others untouched", async () => {
      const location = await seedOwnLocation({
        streetAddress: "123 Main St",
        city: "Boise",
      });

      await portal().updateProviderLocation({
        locationId: location.id,
        city: "Nampa",
      });

      const updated = await testPrismaClient.housingProviderLocation.findUnique(
        { where: { id: location.id } },
      );
      expect(updated).toMatchObject({
        streetAddress: "123 Main St",
        city: "Nampa",
      });
    });

    it("rejects a request with no fields besides locationId", async () => {
      const location = await seedOwnLocation();

      await expect(
        portal().updateProviderLocation({ locationId: location.id }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("is reflected by the existing read procedure", async () => {
      const location = await seedOwnLocation();

      await portal().updateProviderLocation({
        locationId: location.id,
        ...VALID_LOCATION_UPDATE,
      });

      const details = await portal().getProviderDetails();
      expect(details.locations).toContainEqual(
        expect.objectContaining({
          id: location.id,
          streetAddress: VALID_LOCATION_UPDATE.streetAddress,
          district: VALID_LOCATION_UPDATE.district,
        }),
      );
    });

    it("changes nothing and fails when the location belongs to the other provider the caller manages", async () => {
      const location = await seedOwnLocation({}, otherHousingProviderId);

      await expect(
        portal().updateProviderLocation({
          locationId: location.id,
          ...VALID_LOCATION_UPDATE,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const untouched =
        await testPrismaClient.housingProviderLocation.findUnique({
          where: { id: location.id },
        });
      expect(untouched).toMatchObject({
        streetAddress: "123 Main St",
        district: "District 1",
      });
    });

    it("rejects empty and whitespace-only required fields", async () => {
      const location = await seedOwnLocation();

      await expect(
        portal().updateProviderLocation({
          locationId: location.id,
          ...VALID_LOCATION_UPDATE,
          city: "   ",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a ZIP that isn't exactly 5 digits", async () => {
      const location = await seedOwnLocation();

      await expect(
        portal().updateProviderLocation({
          locationId: location.id,
          ...VALID_LOCATION_UPDATE,
          zip: "8364",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a district outside the fixed district list", async () => {
      const location = await seedOwnLocation();

      await expect(
        (
          portal().updateProviderLocation as unknown as (
            input: Record<string, unknown>,
          ) => Promise<unknown>
        )({
          locationId: location.id,
          ...VALID_LOCATION_UPDATE,
          district: "D99",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("throws NOT_FOUND for a location id that doesn't exist", async () => {
      await expect(
        portal().updateProviderLocation({
          locationId: "nonexistent-location-id",
          ...VALID_LOCATION_UPDATE,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("staff caller", () => {
    it("cannot rename a housing provider", async () => {
      await expect(
        staffCaller().housingApplication.updateHousingProvider({
          housingProviderName: "Hijacked Housing",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("cannot update a provider's personal details", async () => {
      await expect(
        staffCaller().housingApplication.updateProviderProfile({
          contactName: "John Doe",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("cannot update a provider location", async () => {
      const location = await createHousingProviderLocation(testPrismaClient, {
        providerId: housingProviderId,
      });

      await expect(
        staffCaller().housingApplication.updateProviderLocation({
          locationId: location.id,
          ...VALID_LOCATION_UPDATE,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
