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

import type { EligibilityParams } from "~@idaho-th/shared";

import type { EligibleHousingProviderRow } from "../../../../../../interfaces/common";
import { prepareEligibleProviders } from "../../../utils/prepareEligibleProviders";
import { splitProviders } from "../splitProviders";

const baseLocation = {
  id: "loc-1",
  district: "D1",
  acceptedGenders: ["MALE" as const, "FEMALE" as const],
  acceptsRiders: false,
  acceptsSexOffenders: true,
  acceptsViolentCriminals: true,
  faithBased: false,
};

function makeRow(
  id: string,
  name: string,
  overrides: Partial<typeof baseLocation> & {
    isSelected?: boolean | null;
  } = {},
): EligibleHousingProviderRow {
  const { isSelected = null, ...locationOverrides } = overrides;
  return {
    provider: { id, name, contact: null },
    providerLocation: { ...baseLocation, ...locationOverrides },
    isSelected,
  } as EligibleHousingProviderRow;
}

const baseParams: EligibilityParams = {
  preferredProviders: [],
  preferredDistricts: [],
  gender: "MALE",
  isRider: false,
  isSexOffender: false,
  faithBasedPreferred: null,
};

function split(
  rows: EligibleHousingProviderRow[],
  sentIds: Set<string>,
  params: EligibilityParams = baseParams,
) {
  return splitProviders(prepareEligibleProviders(rows, params), sentIds);
}

describe("splitProviders", () => {
  it("returns empty lists when eligibleRows is empty", () => {
    const result = split([], new Set());
    expect(result.selected).toHaveLength(0);
    expect(result.suggestions).toHaveLength(0);
  });

  it("places providers with isSelected: true in selected", () => {
    const rows = [
      makeRow("p1", "Hope Housing", { isSelected: true }),
      makeRow("p2", "Bay Shelter"),
    ];
    const params = { ...baseParams, preferredProviders: ["p1"] };

    const result = split(rows, new Set(), params);

    expect(result.selected.map((p) => p.id)).toEqual(["p1"]);
    expect(result.suggestions.map((p) => p.id)).toEqual(["p2"]);
  });

  it("excludes a provider in sentProviderIds from suggestions", () => {
    const rows = [makeRow("p1", "Hope Housing"), makeRow("p2", "Bay Shelter")];
    const sentIds = new Set(["p2"]);

    const result = split(rows, sentIds);

    expect(result.selected).toHaveLength(0);
    expect(result.suggestions.map((p) => p.id)).toEqual(["p1"]);
  });

  it("excludes a provider in sentIds even when isSelected is true", () => {
    const rows = [
      makeRow("p1", "Hope Housing", { isSelected: true }),
      makeRow("p2", "Bay Shelter"),
    ];
    const sentIds = new Set(["p1"]);

    const result = split(rows, sentIds);

    expect(result.selected).toHaveLength(0);
    expect(result.suggestions.map((p) => p.id)).toEqual(["p2"]);
  });

  it("provider with isSelected: false appears in suggestions", () => {
    const rows = [
      makeRow("p1", "Hope Housing", { isSelected: false }),
      makeRow("p2", "Bay Shelter", { isSelected: true }),
    ];

    const result = split(rows, new Set());

    expect(result.selected.map((p) => p.id)).toEqual(["p2"]);
    expect(result.suggestions.map((p) => p.id)).toEqual(["p1"]);
  });

  it("sets isPreferred flag only on providers in preferredProviders", () => {
    const rows = [
      makeRow("p1", "Hope Housing", { isSelected: true }),
      makeRow("p2", "Bay Shelter"),
    ];
    const params = { ...baseParams, preferredProviders: ["p1"] };

    const result = split(rows, new Set(), params);

    expect(result.selected[0].isPreferred).toBe(true);
    expect(result.suggestions[0].isPreferred).toBe(false);
  });
});
