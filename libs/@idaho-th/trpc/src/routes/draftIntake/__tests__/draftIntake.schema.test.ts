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

import { DEFAULT_HOUSING_APPLICATION_FORM_VALUES } from "~@idaho-th/shared/fixtures/housingApplication";

import { submitDraftHousingApplicationSchema } from "../draftIntake.schema";

describe("submitDraftHousingApplicationSchema", () => {
  it("accepts a stale client payload and strips its eligibility params", () => {
    const parsed = submitDraftHousingApplicationSchema.parse({
      id: "app-1",
      formData: DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
      eligibilityParams: {
        preferredDistricts: ["D1"],
        gender: "Male",
        isRider: null,
        isSexOffender: false,
        hasViolenceHistory: null,
        faithBasedPreferred: null,
        preferredProviders: [],
      },
    });

    expect(parsed).not.toHaveProperty("eligibilityParams");
    expect(Object.keys(parsed).toSorted()).toEqual(["formData", "id"]);
  });
});
