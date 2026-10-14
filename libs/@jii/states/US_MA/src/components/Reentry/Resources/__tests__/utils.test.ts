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

import { UsMaTFunction } from "~@jii/translation";

import {
  getLengthOfStayChip,
  getRentChip,
  getResourceChips,
  groupResourcesBySubcategory,
} from "../utils";
import { loadUsMaTranslations, makeResource } from "./testUtils";

let t: UsMaTFunction;

beforeAll(async () => {
  t = await loadUsMaTranslations();
});

describe("groupResourcesBySubcategory", () => {
  test("groups by subcategory in name order, matching the category case-insensitively", () => {
    const shelter = makeResource(1, {
      categories: [{ category: "Housing", subcategory: "Shelter" }],
    });
    const both = makeResource(2, {
      categories: [
        { category: "Housing", subcategory: "Shelter" },
        { category: "Housing", subcategory: "Medical facility" },
      ],
    });
    const employment = makeResource(3, {
      categories: [{ category: "Employment", subcategory: "Job training" }],
    });

    expect(
      groupResourcesBySubcategory([shelter, both, employment], "housing"),
    ).toEqual([
      ["Medical facility", [both]],
      ["Shelter", [shelter, both]],
    ]);
  });
});

describe("getRentChip", () => {
  test.each([
    [{ weeklyRent: { min: 0, max: 0 } }, "Rent: Free"],
    [{ weeklyRent: { min: 150, max: 200 } }, "Rent: $150–$200/week"],
    [{ weeklyRent: { min: 100, max: 100 } }, "Rent: $100/week"],
    [{ weeklyRent: { min: 187.5, max: 187.5 } }, "Rent: $187.50/week"],
    [{ weeklyRent: { min: 22.75, max: 1200 } }, "Rent: $22.75–$1,200/week"],
    [{ rentAsIncomePercent: 30 }, "Rent: 30% of income"],
    [
      { weeklyRent: { min: 150, max: 200 }, rentAsIncomePercent: 30 },
      "Rent: Varies",
    ],
    [
      { weeklyRent: { min: 0, max: 0 }, rentAsIncomePercent: 30 },
      "Rent: Varies",
    ],
    [{}, "No rent info listed"],
  ])("%j → %s", (attributes, expected) => {
    expect(getRentChip({ category: "Housing", ...attributes }, t)).toBe(
      expected,
    );
  });
});

describe("getLengthOfStayChip", () => {
  test.each([
    [{ programLengthMonths: { min: 6, max: 12 } }, "6–12 months"],
    [{ programLengthMonths: { min: 6, max: 6 } }, "6 months"],
    [{}, "No program length info listed"],
  ])("%j → %s", (attributes, expected) => {
    expect(getLengthOfStayChip({ category: "Housing", ...attributes }, t)).toBe(
      expected,
    );
  });
});

describe("getResourceChips", () => {
  test("orders gender, rent, length of stay, then Accepts, and drops unknown tags", () => {
    const resource = makeResource(1, {
      tags: ["Parolees Accepted", "Co-ed", "Spanish", "Sex Offenders Accepted"],
      categoryAttributes: {
        category: "Housing",
        weeklyRent: { min: 150, max: 200 },
      },
    });

    expect(getResourceChips(resource, t)).toEqual([
      "Co-ed",
      "Rent: $150–$200/week",
      "No program length info listed",
      "Parolees",
      "Sex offenses",
    ]);
  });

  test("leaves out rent and length of stay without housing attributes", () => {
    expect(getResourceChips(makeResource(1, { tags: ["Female"] }), t)).toEqual([
      "Female",
    ]);
  });
});
