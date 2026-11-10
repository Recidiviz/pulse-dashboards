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

import { EligibleHousingProviderRow } from "~@idaho-th/client/interfaces/common";
import type { EligibilityParams } from "~@idaho-th/shared";

import { prepareEligibleProviders } from "../prepareEligibleProviders";

const baseLocation = {
  id: "loc-1",
  district: "D1",
  acceptedGenders: ["MALE" as const, "FEMALE" as const],
  acceptsRiders: true,
  acceptsSexOffenders: true,
  acceptsViolentCriminals: true,
  faithBased: false,
};

function makeRow(id: string, name: string): EligibleHousingProviderRow {
  return {
    provider: { id, name, contact: null },
    providerLocation: baseLocation,
    isSelected: null,
  } as EligibleHousingProviderRow;
}

const baseParams: EligibilityParams = {
  preferredProviders: [],
  preferredDistricts: ["d1"],
  gender: "Male",
  isRider: false,
  isSexOffender: false,
  faithBasedPreferred: null,
};

describe("prepareEligibleProviders", () => {
  it("sorts preferred providers ahead of non-preferred providers", () => {
    const rows = [makeRow("p1", "Bay Shelter"), makeRow("p2", "Hope Housing")];
    const params = { ...baseParams, preferredProviders: ["p2"] };

    const prepared = prepareEligibleProviders(rows, params);

    expect(prepared.map((provider) => provider.name)).toEqual([
      "Hope Housing",
      "Bay Shelter",
    ]);
    expect(prepared[0].isPreferred).toBe(true);
    expect(prepared[1].isPreferred).toBe(false);
  });

  it("attaches eligibility labels to each provider", () => {
    const rows = [makeRow("p1", "Hope Housing")];

    const prepared = prepareEligibleProviders(rows, baseParams);

    expect(prepared[0].labels?.length).toBeGreaterThan(0);
    expect(prepared[0].labels?.some((label) => label.text === "D1")).toBe(true);
  });

  it("keeps preferred providers first even when labels include errors", () => {
    const preferredMismatch = {
      ...makeRow("p2", "Hope Housing"),
      providerLocation: {
        ...baseLocation,
        acceptedGenders: ["FEMALE" as const],
        district: "D9",
      },
    } as EligibleHousingProviderRow;
    const other = makeRow("p1", "Bay Shelter");
    const params = {
      ...baseParams,
      preferredProviders: ["p2"],
      gender: "Male",
      preferredDistricts: ["d1"],
    };

    const prepared = prepareEligibleProviders(
      [other, preferredMismatch],
      params,
    );

    expect(prepared[0].name).toBe("Hope Housing");
    expect(prepared[0].isPreferred).toBe(true);
    expect(prepared[0].labels?.some((label) => label.state === "error")).toBe(
      true,
    );
    expect(prepared[1].name).toBe("Bay Shelter");
  });
});
