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

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EligibilityParams } from "~@idaho-th/shared";
import type { HousingProvider } from "~@idaho-th/trpc/routes/housing-common/eligibilityEngine";
import { getProvidersWithEligibility } from "~@idaho-th/trpc/routes/providerMatching/providerMatching.service";

const findManyHousingProviders = vi.fn();

const prisma = {
  housingProvider: {
    findMany: findManyHousingProviders,
  },
} as unknown as Parameters<typeof getProvidersWithEligibility>[0];

const baseProvider = {
  locations: [],
  name: "Provider",
} satisfies Omit<HousingProvider, "id">;

beforeEach(() => {
  findManyHousingProviders.mockReset();
});

describe("getProvidersWithEligibility", () => {
  it("normalizes eligibility filters, tags preferred providers, and returns best provider locations", async () => {
    const eligibleProvider = {
      ...baseProvider,
      id: "eligible-provider",
      locations: [
        {
          acceptedGenders: ["MALE"],
          acceptsRiders: true,
          acceptsSexOffenders: false,
          acceptsViolentCriminals: false,
          district: "District 1",
          faithBased: true,
          id: "eligible-location",
        },
      ],
      name: "Eligible Home",
    };
    const preferredProvider = {
      ...baseProvider,
      id: "preferred-provider",
      locations: [
        {
          acceptedGenders: ["FEMALE"],
          acceptsRiders: false,
          acceptsSexOffenders: false,
          acceptsViolentCriminals: false,
          district: "District 2",
          faithBased: false,
          id: "preferred-location",
        },
      ],
      name: "Preferred Home",
    };
    findManyHousingProviders.mockResolvedValue([
      eligibleProvider,
      preferredProvider,
    ]);

    const params: EligibilityParams = {
      faithBasedPreferred: true,
      gender: " Male ",
      isRider: true,
      isSexOffender: false,
      preferredDistricts: [" District 1 "],
      preferredProviders: ["preferred-provider"],
    };

    const result = await getProvidersWithEligibility(prisma, {
      eligibilityParams: params,
    });

    expect(findManyHousingProviders).toHaveBeenCalledWith({
      include: { locations: true },
      orderBy: { name: "asc" },
      where: undefined,
    });
    expect(result.providers).toEqual([
      {
        id: "eligible-provider",
        isPreferred: false,
        name: "Eligible Home",
        providerLocation: {
          acceptedGenders: ["MALE"],
          acceptsRiders: true,
          acceptsSexOffenders: false,
          acceptsViolentCriminals: false,
          district: "District 1",
          faithBased: true,
          id: "eligible-location",
        },
      },
      {
        id: "preferred-provider",
        isPreferred: true,
        name: "Preferred Home",
        providerLocation: {
          acceptedGenders: ["FEMALE"],
          acceptsRiders: false,
          acceptsSexOffenders: false,
          acceptsViolentCriminals: false,
          district: "District 2",
          faithBased: false,
          id: "preferred-location",
        },
      },
    ]);
  });

  it("uses search filters when provider search is provided", async () => {
    const params: EligibilityParams = {
      faithBasedPreferred: null,
      gender: undefined,
      isRider: null,
      isSexOffender: null,
      preferredDistricts: [],
      preferredProviders: [],
    };
    findManyHousingProviders.mockResolvedValue([]);

    await getProvidersWithEligibility(prisma, {
      eligibilityParams: params,
      search: {
        name: {
          contains: "provider",
          mode: "insensitive",
        },
      },
    });

    expect(findManyHousingProviders).toHaveBeenCalledWith({
      include: { locations: true },
      orderBy: { name: "asc" },
      where: {
        name: {
          contains: "provider",
          mode: "insensitive",
        },
      },
    });
  });

  it("rejects a search whose keys are all outside the allowlist instead of returning every provider", async () => {
    const params: EligibilityParams = {
      faithBasedPreferred: null,
      gender: undefined,
      isRider: null,
      isSexOffender: null,
      preferredDistricts: [],
      preferredProviders: [],
    };

    await expect(
      getProvidersWithEligibility(prisma, {
        eligibilityParams: params,
        search: {
          auth0Sub: { contains: "x", mode: "insensitive" },
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(findManyHousingProviders).not.toHaveBeenCalled();
  });
});
