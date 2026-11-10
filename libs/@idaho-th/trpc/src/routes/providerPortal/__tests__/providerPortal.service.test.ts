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
import { beforeEach, describe, expect, it } from "vitest";

import {
  createHousingProviderLocation,
  seedProviderUserWithHousingProviders,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  getCurrentProvider,
  getProviderDetails,
} from "../providerPortal.service";

// One person managing two organizations: the portal must answer for exactly the
// one it was given, never the other.
let providerUserId: string;
let housingProviderId: string;
let otherHousingProviderId: string;

beforeEach(async () => {
  const { user, housingProviders } = await seedProviderUserWithHousingProviders(
    testPrismaClient,
    {
      user: { name: "Jane Doe", contactPhone: "555-0100" },
      housingProviders: [{ name: "Acme Housing" }, { name: "Beta Housing" }],
    },
  );
  providerUserId = user.id;
  housingProviderId = housingProviders[0].id;
  otherHousingProviderId = housingProviders[1].id;
});

describe("getCurrentProvider", () => {
  it("returns id/name for the provider the caller is acting as", async () => {
    await expect(
      getCurrentProvider(testPrismaClient, housingProviderId),
    ).resolves.toEqual({ id: housingProviderId, name: "Acme Housing" });
  });

  it("does not return the other provider the same person manages", async () => {
    const current = await getCurrentProvider(
      testPrismaClient,
      housingProviderId,
    );

    expect(current.id).not.toBe(otherHousingProviderId);
    expect(current.name).not.toBe("Beta Housing");
  });

  it("throws NOT_FOUND when no provider matches the id", async () => {
    await expect(
      getCurrentProvider(testPrismaClient, uniqueId("missing")),
    ).rejects.toThrow(TRPCError);
  });
});

describe("getProviderDetails", () => {
  it("maps the provider and the caller's own contact details", async () => {
    const location = await createHousingProviderLocation(testPrismaClient, {
      providerId: housingProviderId,
    });

    const details = await getProviderDetails(testPrismaClient, {
      providerId: housingProviderId,
      providerUserId,
    });

    expect(details).toMatchObject({
      housingProviderName: "Acme Housing",
      contactName: "Jane Doe",
      contactPhone: "555-0100",
      locations: [
        {
          id: location.id,
          streetAddress: "123 Main St",
          city: "Boise",
          state: "ID",
          zip: "83702",
          district: "District 1",
          acceptedGenders: ["ALL"],
          acceptsRiders: true,
          acceptsSexOffenders: false,
          acceptsViolentCriminals: false,
          faithBased: false,
        },
      ],
    });
    expect(details.contactEmail).toEqual(expect.any(String));
  });

  it("omits the other provider's locations", async () => {
    const own = await createHousingProviderLocation(testPrismaClient, {
      providerId: housingProviderId,
      streetAddress: "1 Own St",
    });
    const other = await createHousingProviderLocation(testPrismaClient, {
      providerId: otherHousingProviderId,
      streetAddress: "2 Other St",
    });

    const details = await getProviderDetails(testPrismaClient, {
      providerId: housingProviderId,
      providerUserId,
    });

    const locationIds = details.locations.map((location) => location.id);
    expect(locationIds).not.toContain(other.id);
    expect(locationIds).toEqual([own.id]);
  });

  it("returns locations ordered by district then street address", async () => {
    await createHousingProviderLocation(testPrismaClient, {
      providerId: housingProviderId,
      district: "District 2",
      streetAddress: "1 Elm St",
    });
    await createHousingProviderLocation(testPrismaClient, {
      providerId: housingProviderId,
      district: "District 1",
      streetAddress: "9 Oak St",
    });
    await createHousingProviderLocation(testPrismaClient, {
      providerId: housingProviderId,
      district: "District 1",
      streetAddress: "2 Birch St",
    });

    const result = await getProviderDetails(testPrismaClient, {
      providerId: housingProviderId,
      providerUserId,
    });

    expect(result.locations.map((location) => location.streetAddress)).toEqual([
      "2 Birch St",
      "9 Oak St",
      "1 Elm St",
    ]);
  });

  it("returns no locations for a provider that has none", async () => {
    await expect(
      getProviderDetails(testPrismaClient, {
        providerId: housingProviderId,
        providerUserId,
      }),
    ).resolves.toMatchObject({ locations: [] });
  });

  it("throws NOT_FOUND when no provider matches the id", async () => {
    await expect(
      getProviderDetails(testPrismaClient, {
        providerId: uniqueId("missing"),
        providerUserId,
      }),
    ).rejects.toThrow(TRPCError);
  });
});
