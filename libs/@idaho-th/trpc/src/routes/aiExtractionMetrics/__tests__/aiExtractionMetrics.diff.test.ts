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

import { DEFAULT_HOUSING_APPLICATION_FORM_VALUES as DEFAULT_FORM_VALUES } from "~@idaho-th/shared/fixtures/housingApplication";

import { computeFieldOverrides } from "../aiExtractionMetrics.service";

describe("computeFieldOverrides", () => {
  it("reports no overrides when the submitted values match the baseline", () => {
    const result = computeFieldOverrides(DEFAULT_FORM_VALUES, {
      ...DEFAULT_FORM_VALUES,
    });

    expect(result).toEqual({ overriddenFieldCount: 0, overriddenFields: [] });
  });

  it("counts each field the CM changed from the baseline", () => {
    const result = computeFieldOverrides(DEFAULT_FORM_VALUES, {
      ...DEFAULT_FORM_VALUES,
      clientFullName: "Jane Doe",
      age: 42,
    });

    expect(result.overriddenFieldCount).toBe(2);
    expect(result.overriddenFields).toEqual(
      expect.arrayContaining(["clientFullName", "age"]),
    );
  });

  it("treats null, empty string, and empty array as equivalent 'empty' values", () => {
    const result = computeFieldOverrides(
      { ...DEFAULT_FORM_VALUES, legalCurrentStatus: null, idsOnFile: [] },
      { ...DEFAULT_FORM_VALUES, legalCurrentStatus: "", idsOnFile: null },
    );

    expect(result).toEqual({ overriddenFieldCount: 0, overriddenFields: [] });
  });

  it("compares list fields as order-insensitive sets, not a real override on reorder", () => {
    const result = computeFieldOverrides(
      {
        ...DEFAULT_FORM_VALUES,
        preferredDistrict: ["D1", "D2"],
        preferredProviders: ["A", "B", ""],
      },
      {
        ...DEFAULT_FORM_VALUES,
        preferredDistrict: ["D2", "D1"],
        preferredProviders: ["B", "A", ""],
      },
    );

    expect(result).toEqual({ overriddenFieldCount: 0, overriddenFields: [] });
  });

  it("does not flag preferredProviders as overridden when the baseline is padded to 3 display slots but the submission isn't", () => {
    // normalizeDefaultValues pads the AI baseline to exactly 3 slots for
    // form display; the write schema strips empty slots from the submitted
    // side at the boundary. A shorter, unpadded submission with the same
    // real ids must not register as an override just because of that.
    const result = computeFieldOverrides(
      { ...DEFAULT_FORM_VALUES, preferredProviders: ["provider-1", "", ""] },
      { ...DEFAULT_FORM_VALUES, preferredProviders: ["provider-1"] },
    );

    expect(result).toEqual({ overriddenFieldCount: 0, overriddenFields: [] });
  });

  it("still flags a list field when its contents actually changed", () => {
    const result = computeFieldOverrides(
      { ...DEFAULT_FORM_VALUES, medicalAccommodations: ["Wheelchair access"] },
      { ...DEFAULT_FORM_VALUES, medicalAccommodations: ["Hearing assistance"] },
    );

    expect(result).toEqual({
      overriddenFieldCount: 1,
      overriddenFields: ["medicalAccommodations"],
    });
  });

  it("never counts the server-set cmEmailOnFile as an override", () => {
    // It comes from the submitting CM's Auth0 login, so it is never AI-extracted.
    const result = computeFieldOverrides(
      { ...DEFAULT_FORM_VALUES, cmEmailOnFile: "old@example.com" },
      { ...DEFAULT_FORM_VALUES, cmEmailOnFile: "new@example.com" },
    );

    expect(result).toEqual({ overriddenFieldCount: 0, overriddenFields: [] });
  });

  it.each([
    ["numbers", 0, 0, false],
    ["differing numbers", 0, 1, true],
    ["booleans", false, false, false],
    ["differing booleans", false, true, true],
  ])(
    "compares %s by strict equality rather than emptiness",
    (_label, baseline, current, expectedOverride) => {
      // isEmpty only treats null/undefined/blank strings/empty arrays as empty,
      // so 0 and false are real values that must compare strictly.
      const result = computeFieldOverrides(
        { ...DEFAULT_FORM_VALUES, age: baseline },
        { ...DEFAULT_FORM_VALUES, age: current },
      );

      expect(result.overriddenFields.includes("age")).toBe(expectedOverride);
    },
  );

  it("flags a list field whose length changed", () => {
    expect(
      computeFieldOverrides(
        { ...DEFAULT_FORM_VALUES, idsOnFile: ["State ID"] },
        {
          ...DEFAULT_FORM_VALUES,
          idsOnFile: ["State ID", "Birth Certificate"],
        },
      ).overriddenFields,
    ).toEqual(["idsOnFile"]);
  });

  it.each([
    ["a non-array baseline against a populated list", "State ID", ["State ID"]],
    ["a populated list against a non-array current", ["State ID"], "State ID"],
  ])("treats %s as an override", (_label, baseline, current) => {
    // A non-array reads as an empty list, so the lengths differ.
    expect(
      computeFieldOverrides(
        { ...DEFAULT_FORM_VALUES, idsOnFile: baseline },
        { ...DEFAULT_FORM_VALUES, idsOnFile: current },
      ).overriddenFields,
    ).toEqual(["idsOnFile"]);
  });

  it("treats two non-array list values as matching empties", () => {
    expect(
      computeFieldOverrides(
        { ...DEFAULT_FORM_VALUES, idsOnFile: "State ID" },
        { ...DEFAULT_FORM_VALUES, idsOnFile: 42 },
      ).overriddenFields,
    ).not.toContain("idsOnFile");
  });
});
