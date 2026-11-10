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
  buildMedicalAccommodationSelections,
  isRider,
  normalizeGenderLabel,
  normalizeGenderLabelStrict,
} from "~@idaho-th/shared";

describe("isRider", () => {
  it("matches Rider case-insensitively after trimming", () => {
    expect(isRider("Rider")).toBe(true);
    expect(isRider("  rider ")).toBe(true);
  });

  it("treats every other value, including a missing one, as Termer/PV", () => {
    expect(isRider("Termer")).toBe(false);
    expect(isRider("Parole Violator")).toBe(false);
    expect(isRider("Rider 2")).toBe(false);
    expect(isRider("")).toBe(false);
    expect(isRider(null)).toBe(false);
    expect(isRider(undefined)).toBe(false);
  });
});

describe("normalizeGenderLabel", () => {
  it("maps OCR / free-text values onto form gender options", () => {
    expect(normalizeGenderLabel("m")).toBe("Male");
    expect(normalizeGenderLabel("FEMALE")).toBe("Female");
    expect(normalizeGenderLabel("nonbinary")).toBe("Non-binary");
    expect(normalizeGenderLabel("prefer not to say")).toBe("Prefer not to say");
    expect(normalizeGenderLabel("other")).toBe("Other");
  });

  it("returns null for empty or unrecognized values", () => {
    expect(normalizeGenderLabel(null)).toBeNull();
    expect(normalizeGenderLabel("  ")).toBeNull();
    expect(normalizeGenderLabel("unknown")).toBeNull();
  });
});

describe("normalizeGenderLabelStrict", () => {
  it("falls back to Other (or a custom fallback) when normalization fails", () => {
    expect(normalizeGenderLabelStrict(undefined)).toBe("Other");
    expect(normalizeGenderLabelStrict("???")).toBe("Other");
    expect(normalizeGenderLabelStrict(null, "Male")).toBe("Male");
  });
});

describe("buildMedicalAccommodationSelections", () => {
  it("includes only accommodations explicitly marked true", () => {
    expect(
      buildMedicalAccommodationSelections({
        prescriptionMedication: true,
        assistanceCbrs: false,
        moudMatProgram: true,
        contagiousRowSelected: null,
        ongoingMedicalMhTreatment: true,
      }),
    ).toEqual([
      "Prescription Medication",
      "MOUD/MAT Program",
      "Ongoing Medical/MH Treatment",
    ]);
  });
});
