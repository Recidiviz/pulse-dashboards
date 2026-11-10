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

import { ACCEPTED_GENDER } from "~@idaho-th/shared";
import { getProvidersWithEligibility } from "~@idaho-th/trpc/routes/providerMatching/providerMatching.service";
import { findEligibleHousingProviders } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.helpers";
import {
  createHousingProvider,
  createHousingProviderLocation,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  buildEligibilityWhere,
  matchProviders,
  pickBestLocation,
} from "../eligibilityEngine";
import type {
  EligibilityParams,
  HousingProvider,
  HousingProviderLocation,
} from "../types";
import { booleanMatch } from "../utils";

function makeLocation(
  overrides: Partial<HousingProviderLocation> = {},
): HousingProviderLocation {
  return {
    id: "loc-1",
    district: "D1",
    acceptedGenders: [ACCEPTED_GENDER.ALL],
    acceptsRiders: false,
    acceptsSexOffenders: false,
    acceptsViolentCriminals: false,
    faithBased: false,
    ...overrides,
  };
}

function makeParams(
  overrides: Partial<EligibilityParams> = {},
): EligibilityParams {
  return {
    preferredDistricts: [],
    gender: undefined,
    isRider: null,
    isSexOffender: null,
    faithBasedPreferred: null,
    preferredProviders: [],
    ...overrides,
  };
}

describe("booleanMatch", () => {
  it("returns true only when the client flag is true and the location accepts it", () => {
    const criterion = booleanMatch("isRider", "acceptsRiders");
    expect(
      criterion(
        makeParams({ isRider: true }),
        makeLocation({ acceptsRiders: true }),
      ),
    ).toBe(true);
    expect(
      criterion(
        makeParams({ isRider: true }),
        makeLocation({ acceptsRiders: false }),
      ),
    ).toBe(false);
    expect(
      criterion(
        makeParams({ isRider: false }),
        makeLocation({ acceptsRiders: true }),
      ),
    ).toBe(false);
    expect(
      criterion(
        makeParams({ isRider: null }),
        makeLocation({ acceptsRiders: true }),
      ),
    ).toBe(false);
  });
});

describe("pickBestLocation", () => {
  it("returns the only location when a provider has a single site", () => {
    const only = makeLocation({ id: "only" });
    expect(pickBestLocation([only], makeParams())).toBe(only);
  });

  it("prefers the location matching the preferred district (highest priority criterion)", () => {
    const d1 = makeLocation({ id: "d1", district: "d1" });
    const d2 = makeLocation({
      id: "d2",
      district: "d2",
      acceptsRiders: true,
      acceptsSexOffenders: true,
      acceptsViolentCriminals: true,
    });

    const best = pickBestLocation(
      [d2, d1],
      makeParams({ preferredDistricts: ["d1"] }),
    );

    expect(best.id).toBe("d1");
  });

  it("breaks ties using higher-priority criteria before lower-priority ones", () => {
    const genderMatchOnly = makeLocation({
      id: "gender",
      district: "other",
      acceptedGenders: [ACCEPTED_GENDER.MALE],
    });
    const riderMatchOnly = makeLocation({
      id: "rider",
      district: "other",
      acceptedGenders: [ACCEPTED_GENDER.FEMALE],
      acceptsRiders: true,
    });

    const best = pickBestLocation(
      [riderMatchOnly, genderMatchOnly],
      makeParams({ gender: "male", isRider: true }),
    );

    // Both score 1, but gender ranks above rider in SCORE_CRITERIA.
    expect(best.id).toBe("gender");
  });

  it("selects the highest total score across district, gender, and risk flags", () => {
    const weak = makeLocation({
      id: "weak",
      district: "d1",
      acceptedGenders: [ACCEPTED_GENDER.FEMALE],
    });
    const strong = makeLocation({
      id: "strong",
      district: "d1",
      acceptedGenders: [ACCEPTED_GENDER.MALE],
      acceptsRiders: true,
      acceptsSexOffenders: true,
    });

    const best = pickBestLocation(
      [weak, strong],
      makeParams({
        preferredDistricts: ["d1"],
        gender: "male",
        isRider: true,
        isSexOffender: true,
      }),
    );

    expect(best.id).toBe("strong");
  });
});

describe("buildEligibilityWhere", () => {
  it("returns an empty filter when no eligibility or preferred providers are set", () => {
    expect(buildEligibilityWhere(makeParams())).toEqual({});
  });

  it("filters by preferred provider id only when no location criteria exist", () => {
    expect(
      buildEligibilityWhere(
        makeParams({
          preferredProviders: ["3f7b1d24-64a1-4b6a-9c1e-000000000001"],
        }),
      ),
    ).toEqual({
      id: { in: ["3f7b1d24-64a1-4b6a-9c1e-000000000001"] },
    });
  });

  it("builds location AND requirements for district, gender, and risk flags", () => {
    const where = buildEligibilityWhere(
      makeParams({
        preferredDistricts: ["D1", "D2"],
        gender: "female",
        isRider: true,
        isSexOffender: true,
      }),
    );

    expect(where).toEqual({
      locations: {
        some: {
          AND: [
            { district: { in: ["D1", "D2"], mode: "insensitive" } },
            {
              acceptedGenders: {
                hasSome: [ACCEPTED_GENDER.FEMALE, ACCEPTED_GENDER.ALL],
              },
            },
            { acceptsRiders: true },
            { acceptsSexOffenders: true },
          ],
        },
      },
    });
  });

  it("ORs eligibility matches with preferred providers so overrides stay discoverable", () => {
    const where = buildEligibilityWhere(
      makeParams({
        preferredDistricts: ["D1"],
        preferredProviders: ["3f7b1d24-64a1-4b6a-9c1e-000000000002"],
      }),
    );

    expect(where).toEqual({
      OR: [
        {
          locations: {
            some: {
              AND: [{ district: { in: ["D1"], mode: "insensitive" } }],
            },
          },
        },
        { id: { in: ["3f7b1d24-64a1-4b6a-9c1e-000000000002"] } },
      ],
    });
  });

  it("does not add gender location filters for unrecognized gender values", () => {
    const where = buildEligibilityWhere(
      makeParams({ gender: "non-binary", preferredDistricts: ["D1"] }),
    );

    expect(where).toEqual({
      locations: {
        some: {
          AND: [{ district: { in: ["D1"], mode: "insensitive" } }],
        },
      },
    });
  });

  it("omits risk-flag filters when sex offender and rider status are unknown", () => {
    const where = buildEligibilityWhere(
      makeParams({
        preferredDistricts: ["D1"],
        isRider: null,
        isSexOffender: null,
      }),
    );

    expect(where).toEqual({
      locations: {
        some: {
          AND: [{ district: { in: ["D1"], mode: "insensitive" } }],
        },
      },
    });
    expect(JSON.stringify(where)).not.toContain("acceptsRiders");
    expect(JSON.stringify(where)).not.toContain("acceptsSexOffenders");
    expect(JSON.stringify(where)).not.toContain("acceptsViolentCriminals");
  });
});

describe("matchProviders", () => {
  it("skips providers with no locations and returns the best location per provider", () => {
    const withLocations: HousingProvider = {
      id: "p1",
      name: "Hope",
      locations: [
        makeLocation({ id: "a", district: "d2" }),
        makeLocation({ id: "b", district: "d1" }),
      ],
    };
    const empty: HousingProvider = {
      id: "p2",
      name: "Empty",
      locations: [],
    };

    const matches = matchProviders(
      [empty, withLocations],
      makeParams({ preferredDistricts: ["d1"] }),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].provider.id).toBe("p1");
    expect(matches[0].location.id).toBe("b");
  });
});

// Non-negotiable: a provider renaming their organization must never break a
// client's stated preference. Exercises two real production seams against
// the real test DB:
//   - findEligibleHousingProviders (staffApplication.helpers.ts), which uses
//     buildEligibilityWhere's OR-branch to force an otherwise-ineligible
//     preferred provider into the persisted eligible-provider set;
//   - getProvidersWithEligibility (providerMatching.service.ts), which tags
//     isPreferred for the staff-facing provider list/badge.
// The seeded provider deliberately fails every normal eligibility filter, so
// its presence in findEligibleHousingProviders' result only happens via the
// preferred-provider escape hatch. Because preferredProviders holds the
// provider's ID (never its name), this must keep passing after a rename —
// a UUID never equals a display name.
describe("preferred-provider rename regression (integration)", () => {
  it("keeps a preferred, otherwise-ineligible provider in the eligible set and isPreferred after a rename", async () => {
    const provider = await createHousingProvider(testPrismaClient, {
      name: "Second Chance Homes",
    });
    await createHousingProviderLocation(testPrismaClient, {
      providerId: provider.id,
      district: "District 9",
      acceptedGenders: ["FEMALE"],
      acceptsRiders: false,
    });

    const params: EligibilityParams = {
      preferredDistricts: ["District 1"], // does not match "District 9"
      gender: "male", // does not match ["FEMALE"]
      isRider: true, // does not match acceptsRiders: false
      isSexOffender: null,
      faithBasedPreferred: null,
      preferredProviders: [provider.id],
    };

    async function assertStillPreferredAndEligible() {
      const eligible = await findEligibleHousingProviders(
        testPrismaClient,
        params,
      );
      expect(eligible.map((p) => p.id)).toContain(provider.id);

      const { providers } = await getProvidersWithEligibility(
        testPrismaClient,
        { eligibilityParams: params },
      );
      expect(providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: provider.id, isPreferred: true }),
        ]),
      );
    }

    // Before the rename: the escape hatch already has to work, since the
    // provider fails every normal filter above.
    await assertStillPreferredAndEligible();

    await testPrismaClient.housingProvider.update({
      where: { id: provider.id },
      data: { name: "Brand New Name LLC" },
    });

    // After the rename: nothing about the stored preference changed (it was
    // always the provider's ID), so both checks must still hold.
    await assertStillPreferredAndEligible();
  });
});
