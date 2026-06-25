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
  getBreakdownSectionScoreV2,
  showTrusteeChecklist,
} from "../reclassificationScoreUtils";

describe("showTrusteeChecklist", () => {
  const formDataBase = {
    trusteeNotConvictedOfFirstDegreeMurder: "true",
    trusteeHas10YearsOrLessRemaining: "true",
    isServingLife: "false",
    trusteeNotServingForSexualOffense: "true",
  };

  it("returns true if all critera met and any custody level LOW", () => {
    expect(showTrusteeChecklist("LOW", formDataBase)).toBeTrue();
    expect(
      showTrusteeChecklist("NOT LOW", {
        ...formDataBase,
        counselorRecommendedCustody: "LOW",
      }),
    ).toBeTrue();
    expect(
      showTrusteeChecklist("NOT LOW", {
        ...formDataBase,
        recommendationCustodyLevel: "LOW",
      }),
    ).toBeTrue();
  });

  it("returns false if any criteria makes the candidate ineligible", () => {
    expect(
      showTrusteeChecklist("LOW", {
        ...formDataBase,
        trusteeNotConvictedOfFirstDegreeMurder: "false",
      }),
    ).toBeFalse();
    expect(
      showTrusteeChecklist("LOW", {
        ...formDataBase,
        trusteeHas10YearsOrLessRemaining: "false",
      }),
    ).toBeFalse();
    expect(
      showTrusteeChecklist("LOW", {
        ...formDataBase,
        isServingLife: "true",
      }),
    ).toBeFalse();
    expect(
      showTrusteeChecklist("LOW", {
        ...formDataBase,
        trusteeNotServingForSexualOffense: "false",
      }),
    ).toBeFalse();
  });

  it("returns false if no classification level set to LOW", () => {
    expect(showTrusteeChecklist("NOT LOW", formDataBase)).toBeFalse();
  });
});

describe("getBreakdownSectionScoreV2", () => {
  const section_0_6 = { period: "0-6", multiplier: 1 } as const;
  const section_6_12 = { period: "6-12", multiplier: 1 } as const;
  const section_36_60 = { period: "36-60", multiplier: 2 } as const;

  it("returns 0 when count is undefined, regardless of period", () => {
    expect(getBreakdownSectionScoreV2(section_0_6, undefined)).toBe(0);
    expect(getBreakdownSectionScoreV2(section_6_12, undefined)).toBe(0);
    expect(getBreakdownSectionScoreV2(section_36_60, undefined)).toBe(0);
  });

  it("returns -1 only when count is 0 and period is 0-6", () => {
    expect(getBreakdownSectionScoreV2(section_0_6, 0)).toBe(-1);
    expect(getBreakdownSectionScoreV2(section_6_12, 0)).toBe(0);
    expect(getBreakdownSectionScoreV2(section_36_60, 0)).toBe(0);
  });

  it("returns count * multiplier for positive counts", () => {
    expect(getBreakdownSectionScoreV2(section_0_6, 2)).toBe(2);
    expect(getBreakdownSectionScoreV2(section_6_12, 3)).toBe(3);
    expect(getBreakdownSectionScoreV2(section_36_60, 3)).toBe(6);
  });

  it("does not clamp the row score (per-question max is applied elsewhere)", () => {
    expect(getBreakdownSectionScoreV2(section_36_60, 100)).toBe(200);
  });
});
