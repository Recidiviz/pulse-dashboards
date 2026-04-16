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

import { showTrusteeChecklist } from "../reclassificationScoreUtils";

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
