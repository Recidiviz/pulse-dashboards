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
  ACCEPTED_GENDER,
  acceptsFemale,
  acceptsMale,
  extractEligibilityParams,
  isFemale,
  isMale,
  normalizeEligibilityParams,
} from "~@idaho-th/shared";

describe("isMale / isFemale", () => {
  it("recognizes common normalized male gender tokens", () => {
    expect(isMale("male")).toBe(true);
    expect(isMale("man")).toBe(true);
    expect(isMale("m")).toBe(true);
    expect(isMale("female")).toBe(false);
  });

  it("recognizes common normalized female gender tokens", () => {
    expect(isFemale("female")).toBe(true);
    expect(isFemale("woman")).toBe(true);
    expect(isFemale("f")).toBe(true);
    expect(isFemale("women")).toBe(true);
    expect(isFemale("male")).toBe(false);
  });
});

describe("acceptsMale / acceptsFemale", () => {
  it("accepts an explicit gender or ALL", () => {
    expect(acceptsMale({ acceptedGenders: [ACCEPTED_GENDER.MALE] })).toBe(true);
    expect(acceptsMale({ acceptedGenders: [ACCEPTED_GENDER.ALL] })).toBe(true);
    expect(acceptsMale({ acceptedGenders: [ACCEPTED_GENDER.FEMALE] })).toBe(
      false,
    );

    expect(acceptsFemale({ acceptedGenders: [ACCEPTED_GENDER.FEMALE] })).toBe(
      true,
    );
    expect(acceptsFemale({ acceptedGenders: [ACCEPTED_GENDER.ALL] })).toBe(
      true,
    );
    expect(acceptsFemale({ acceptedGenders: [ACCEPTED_GENDER.MALE] })).toBe(
      false,
    );
  });
});

describe("normalizeEligibilityParams", () => {
  it("trims and lowercases districts and gender", () => {
    expect(
      normalizeEligibilityParams({
        preferredDistricts: [" D1 ", "D2"],
        gender: " Male ",
        isRider: true,
        isSexOffender: null,
        faithBasedPreferred: null,
        preferredProviders: ["3f7b1d24-64a1-4b6a-9c1e-000000000001"],
      }),
    ).toEqual({
      preferredDistricts: ["d1", "d2"],
      gender: "male",
      isRider: true,
      isSexOffender: null,
      faithBasedPreferred: null,
      preferredProviders: ["3f7b1d24-64a1-4b6a-9c1e-000000000001"],
    });
  });

  it("leaves preferred providers (IDs) untouched — no trimming or case changes", () => {
    // preferredProviders are UUIDs now; casing/whitespace are meaningful,
    // so this must pass them through unchanged.
    expect(
      normalizeEligibilityParams({
        preferredDistricts: [],
        gender: undefined,
        isRider: null,
        isSexOffender: null,
        faithBasedPreferred: null,
        preferredProviders: [" 3F7B1D24-64A1-4B6A-9C1E-000000000001 "],
      }).preferredProviders,
    ).toEqual([" 3F7B1D24-64A1-4B6A-9C1E-000000000001 "]);
  });
});

describe("extractEligibilityParams — isRider", () => {
  // Same rule as the release flow (isRider): matching and approvals never
  // disagree on a case's cohort.
  it.each([
    [" Rider ", true],
    ["Termer", false],
    ["Parole Violator", false],
    ["Rider 2", false],
    ["", null],
    [null, null],
  ])("Q6 %o -> %o", (legalCurrentStatus, expected) => {
    expect(extractEligibilityParams({ legalCurrentStatus }).isRider).toBe(
      expected,
    );
  });
});
