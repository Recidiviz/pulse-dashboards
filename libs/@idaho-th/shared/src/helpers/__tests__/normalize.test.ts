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
  dropNoneWhenMixed,
  formatPhone,
  type HousingApplicationForm,
  isValidUsPhoneNumber,
  normalizeDefaultValues,
  normalizeExtractedPhoneFields,
  normalizeUsPhoneNumber,
} from "~@idaho-th/shared";
import { DEFAULT_HOUSING_APPLICATION_FORM_VALUES as DEFAULT_FORM_VALUES } from "~@idaho-th/shared/fixtures/housingApplication";

describe("formatPhone", () => {
  it("formats 10 raw digits as ###-###-####", () => {
    expect(formatPhone("2085550111")).toBe("208-555-0111");
  });

  it("drops a leading US country code instead of truncating the last digit", () => {
    expect(formatPhone("+1 208-555-1234")).toBe("208-555-1234");
  });
});

describe("normalizeUsPhoneNumber", () => {
  it.each(["1 (208) 555-0111", "2085550111", "208-555-0111"])(
    "renders %s as ###-###-####",
    (raw) => {
      expect(normalizeUsPhoneNumber(raw)).toBe("208-555-0111");
    },
  );

  it("returns bare digits when the number isn't 10 digits", () => {
    expect(normalizeUsPhoneNumber("(123")).toBe("123");
  });
});

describe("isValidUsPhoneNumber", () => {
  it.each(["208-555-0111", "(208) 555-0111", "+1 208 555 0111"])(
    "accepts %s",
    (raw) => {
      expect(isValidUsPhoneNumber(raw)).toBe(true);
    },
  );

  it.each(["", "555-0111", "208-555-011", "208-555-01111"])(
    "rejects %s",
    (raw) => {
      expect(isValidUsPhoneNumber(raw)).toBe(false);
    },
  );
});

describe("normalizeExtractedPhoneFields", () => {
  it("coalesces null OCR text fields to empty strings while formatting phones", () => {
    // Raw AI-extracted data can be null even where the canonical type says
    // string (see draftIntake.service.ts's rawAiResponse cast) — mirror that
    // boundary cast here rather than typing around it.
    const normalized = normalizeExtractedPhoneFields({
      ...DEFAULT_FORM_VALUES,
      cmPoPhone: "2085550111",
      cmPoName: null,
      clientFullName: null,
    } as unknown as HousingApplicationForm);

    expect(normalized.cmPoPhone).toBe("208-555-0111");
    expect(normalized.cmPoName).toBe("");
    expect(normalized.clientFullName).toBe("");
  });
});

describe("normalizeDefaultValues", () => {
  it("formats extracted phone fields, nulls out age 0, and pads preferred provider slots", () => {
    const normalized = normalizeDefaultValues({
      ...DEFAULT_FORM_VALUES,
      age: 0,
      personalPhoneNumber: "2085551234",
      // preferredProviders holds provider IDs (UUIDs), not names — slot
      // padding is generic string handling and doesn't care which.
      preferredProviders: ["3f7b1d24-64a1-4b6a-9c1e-000000000001"],
    });

    expect(normalized.personalPhoneNumber).toBe("208-555-1234");
    expect(normalized.age).toBeNull();
    expect(normalized.preferredProviders).toEqual([
      "3f7b1d24-64a1-4b6a-9c1e-000000000001",
      "",
      "",
    ]);
  });
});

describe("dropNoneWhenMixed", () => {
  it("drops None when other options are selected", () => {
    expect(dropNoneWhenMixed(["None", "Custody Agreement"])).toEqual([
      "Custody Agreement",
    ]);
  });

  it("keeps None when it is the only selection", () => {
    expect(dropNoneWhenMixed(["None"])).toEqual(["None"]);
  });

  it("leaves selections without None untouched", () => {
    expect(dropNoneWhenMixed(["A", "B"])).toEqual(["A", "B"]);
  });
});

describe("normalizeDefaultValues — None option", () => {
  it("removes None from multi-select fields that also hold other options", () => {
    const normalized = normalizeDefaultValues({
      ...DEFAULT_FORM_VALUES,
      childFamilyServicesDocumentation: ["None", "Supervision Order"],
    });

    expect(normalized.childFamilyServicesDocumentation).toEqual([
      "Supervision Order",
    ]);
  });

  it("defaults a missing multi-select to an empty selection", () => {
    const normalized = normalizeDefaultValues({
      ...DEFAULT_FORM_VALUES,
      childFamilyServicesDocumentation: undefined,
    } as unknown as HousingApplicationForm);

    expect(normalized.childFamilyServicesDocumentation).toEqual([]);
  });
});
