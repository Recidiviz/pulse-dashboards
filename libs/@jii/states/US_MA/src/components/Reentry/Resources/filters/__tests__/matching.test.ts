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

import { makeResource } from "../../__tests__/testUtils";
import { HousingAttributes, ResourceSummary } from "../../types";
import { bandMatchesRange, matchesFilters } from "../matching";
import { RentOption, SelectedFilters } from "../types";

const band = (gt?: number, lte?: number) =>
  ({ kind: "band", band: { gt, lte } }) as const;

const UP_TO_150 = band(0, 150);
const FROM_151_TO_175 = band(150, 175);
const OVER_200 = band(200);
const FREE: RentOption = { kind: "free" };
const BASED_ON_INCOME: RentOption = { kind: "basedOnIncome" };
const NOT_LISTED: RentOption = { kind: "notListed" };

// Wraps each match in an option, so these cases don't depend on the config's bands.
const rent = (...matches: RentOption[]): SelectedFilters => ({
  rent: matches.map((match, index) => ({
    id: String(index),
    label: () => "",
    match,
  })),
});

let nextId = 1;
function housing(
  name: string,
  attributes: Omit<HousingAttributes, "category"> = {},
): ResourceSummary {
  return makeResource(nextId++, {
    name,
    categoryAttributes: { category: "Housing", ...attributes },
  });
}

describe("bandMatchesRange", () => {
  test.each([
    [{ gt: 150, lte: 175 }, { min: 100, max: 250 }, true],
    [{ gt: 150, lte: 175 }, { min: 160, max: 160 }, true],
    [{ gt: 150, lte: 175 }, { min: 140, max: 150 }, false],
    [{ gt: 150, lte: 175 }, { min: 175, max: 200 }, true],
    [{ gt: 150, lte: 175 }, { min: 176, max: 200 }, false],
    [{ lte: 3 }, { min: 0, max: 1 }, true],
    [{ gt: 12 }, { min: 12, max: 24 }, true],
    [{ gt: 12 }, { min: 6, max: 12 }, false],
  ])("%o against %o is %s", (rangeBand, range, expected) => {
    expect(bandMatchesRange(rangeBand, range)).toBe(expected);
  });
});

describe("rent", () => {
  const resources = [
    housing("Free", { weeklyRent: { min: 0, max: 0 } }),
    housing("Sliding Scale", { weeklyRent: { min: 0, max: 120 } }),
    housing("Wide Range", { weeklyRent: { min: 100, max: 250 } }),
    housing("Exactly 150", {
      weeklyRent: { min: 150, max: 150 },
      rentAsIncomePercent: 30,
    }),
    housing("Income Based", { rentAsIncomePercent: 30 }),
    housing("Not Listed"),
    makeResource(nextId++, { name: "No Attributes" }),
  ];

  test.each<[string, SelectedFilters, string[]]>([
    [
      "no selection",
      rent(),
      [
        "Exactly 150",
        "Free",
        "Income Based",
        "No Attributes",
        "Not Listed",
        "Sliding Scale",
        "Wide Range",
      ],
    ],
    ["a band", rent(UP_TO_150), ["Exactly 150", "Sliding Scale", "Wide Range"]],
    ["a middle band", rent(FROM_151_TO_175), ["Wide Range"]],
    ["an open-ended band", rent(OVER_200), ["Wide Range"]],
    // Wide Range spans both bands and appears once.
    [
      "consecutive bands",
      rent(UP_TO_150, FROM_151_TO_175),
      ["Exactly 150", "Sliding Scale", "Wide Range"],
    ],
    [
      "non-consecutive bands",
      rent(UP_TO_150, OVER_200),
      ["Exactly 150", "Sliding Scale", "Wide Range"],
    ],
    ["free", rent(FREE), ["Free"]],
    ["based on income", rent(BASED_ON_INCOME), ["Exactly 150", "Income Based"]],
    ["not listed", rent(NOT_LISTED), ["No Attributes", "Not Listed"]],
    [
      "a band, free, and not listed",
      rent(OVER_200, FREE, NOT_LISTED),
      ["Free", "No Attributes", "Not Listed", "Wide Range"],
    ],
  ])("%s", (_, filters, expected) => {
    expect(
      resources
        .filter((resource) => matchesFilters(resource, filters))
        .map((resource) => resource.name)
        .sort(),
    ).toEqual(expected);
  });
});
