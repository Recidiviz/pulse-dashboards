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

import { describe, expect, it } from "vitest";

import {
  formatPopulation,
  formatYesNo,
  toAcceptedGenderChoice,
  validateLocationPatch,
} from "../locationCard.utils";

describe("formatPopulation", () => {
  it("shows an em dash when a location accepts nobody yet", () => {
    expect(formatPopulation([])).toBe("—");
  });

  it.each([
    [["MALE"], "Men only"],
    [["FEMALE"], "Women only"],
  ] as const)(
    "labels a single accepted gender as %s only",
    (genders, expected) => {
      expect(formatPopulation([...genders])).toBe(expected);
    },
  );

  it("joins two accepted genders", () => {
    expect(formatPopulation(["MALE", "FEMALE"])).toBe("Men and Women");
  });

  it("preserves the order the genders were given in", () => {
    expect(formatPopulation(["FEMALE", "MALE"])).toBe("Women and Men");
  });

  it.each([
    [["ALL"]],
    [["ALL", "MALE"]],
    [["MALE", "ALL"]],
    [["MALE", "FEMALE", "ALL"]],
  ] as const)("collapses %s to All", (genders) => {
    // ALL subsumes the others; listing "All and Men" would read as a narrower
    // population than the location actually accepts.
    expect(formatPopulation([...genders])).toBe("All");
  });
});

describe("formatYesNo", () => {
  it.each([
    [true, "Yes"],
    [false, "No"],
  ])("renders %s as %s", (value, expected) => {
    expect(formatYesNo(value)).toBe(expected);
  });
});

describe("toAcceptedGenderChoice", () => {
  it.each([
    [["ALL"], "ALL"],
    [["MALE"], "MALE"],
    [["FEMALE"], "FEMALE"],
  ] as const)("maps a single-element %s list to %s", (genders, expected) => {
    expect(toAcceptedGenderChoice([...genders])).toBe(expected);
  });

  it("collapses a legacy two-element row to ALL", () => {
    expect(toAcceptedGenderChoice(["MALE", "FEMALE"])).toBe("ALL");
  });
});

describe("validateLocationPatch", () => {
  it("accepts a patch that only touches non-address fields", () => {
    expect(validateLocationPatch({ acceptsRiders: true })).toEqual({});
  });

  it("accepts a valid address patch", () => {
    expect(validateLocationPatch({ city: "Nampa", zip: "83651" })).toEqual({});
  });

  it("reports a message per invalid address field", () => {
    expect(
      validateLocationPatch({ streetAddress: "  ", zip: "8365" }),
    ).toMatchObject({
      streetAddress: "Street address is required",
      zip: "ZIP must be exactly 5 digits",
    });
  });
});
