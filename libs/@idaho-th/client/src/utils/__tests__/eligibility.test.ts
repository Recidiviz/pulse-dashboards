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

import { DEFAULT_FORM_VALUES } from "../../components/HousingApplicationForm/hooks/useHousingApplicationForm/utils";
import { extractEligibilityParams } from "../eligibility";

describe("extractEligibilityParams", () => {
  it("returns empty defaults when form is undefined", () => {
    expect(extractEligibilityParams(undefined)).toEqual({
      preferredDistricts: [],
      gender: undefined,
      isRider: null,
      isSexOffender: null,
      faithBasedPreferred: null,
      preferredProviders: [],
    });
  });

  it("parses rider status, booleans, and trims district and provider values", () => {
    const params = extractEligibilityParams({
      ...DEFAULT_FORM_VALUES,
      preferredDistrict: [" D1 ", "  "],
      gender: " Male ",
      legalCurrentStatus: "Rider",
      legalSexOffenderRegistry: true,
      faithBasedPreferred: true,
      preferredProviders: [" Provider A ", ""],
    });

    expect(params).toEqual({
      preferredDistricts: ["D1"],
      gender: "Male",
      isRider: true,
      isSexOffender: true,
      faithBasedPreferred: true,
      preferredProviders: ["Provider A"],
    });
  });

  it("returns null rider status when legal current status is blank", () => {
    const params = extractEligibilityParams({
      ...DEFAULT_FORM_VALUES,
      legalCurrentStatus: "  ",
    });

    expect(params.isRider).toBeNull();
  });
});
