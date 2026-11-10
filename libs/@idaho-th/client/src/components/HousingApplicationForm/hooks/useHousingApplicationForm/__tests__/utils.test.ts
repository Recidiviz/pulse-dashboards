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

import { FIELD_KEYS } from "../../../constants/fieldKeys";
import {
  computeWarningFields,
  DEFAULT_FORM_VALUES,
  getErrorForField,
  isDateValid,
  normalizeDefaultValues,
  normalizeExtractedPhoneFields,
} from "../utils";

describe("computeWarningFields", () => {
  /**
   * 10:30pm Mountain on 2026-09-10, already 2026-09-11 in the suite's
   * America/New_York timezone. The release-date warning must read the Mountain
   * date, so freezing here pins the boundary the shared helper exists to fix.
   */
  const FROZEN_NOW = new Date("2026-09-11T04:30:00Z");

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds plausibility warnings for out-of-range required fields", () => {
    const values = {
      ...DEFAULT_FORM_VALUES,
      dob: "01/01/1924",
      age: 101,
      tpdHousingNeededDate: "01/01/2000",
      signatureDate: "12/31/2025",
      signatureProvided: true,
      preferredDistrict: ["D1"],
    };

    const warnings = computeWarningFields(values);

    expect(warnings.has(FIELD_KEYS.dob)).toBe(true);
    expect(warnings.has(FIELD_KEYS.age)).toBe(true);
    expect(warnings.has(FIELD_KEYS.tpdHousingNeededDate)).toBe(true);
    expect(warnings.has(FIELD_KEYS.signatureDate)).toBe(true);
  });

  it("still warns, without blocking, for a release date that has already passed", () => {
    const warnings = computeWarningFields({
      ...DEFAULT_FORM_VALUES,
      tpdHousingNeededDate: "09/09/2026",
    });

    expect(warnings.has(FIELD_KEYS.tpdHousingNeededDate)).toBe(true);
  });

  it("does not warn for a release date that is still today in the business timezone", () => {
    const warnings = computeWarningFields({
      ...DEFAULT_FORM_VALUES,
      tpdHousingNeededDate: "09/10/2026",
    });

    expect(warnings.has(FIELD_KEYS.tpdHousingNeededDate)).toBe(false);
  });

  it("leaves the other date fields' comparisons untouched", () => {
    const warnings = computeWarningFields({
      ...DEFAULT_FORM_VALUES,
      dob: "01/01/1990",
      signatureDate: "09/10/2026",
    });

    expect(warnings.has(FIELD_KEYS.dob)).toBe(false);
    expect(warnings.has(FIELD_KEYS.signatureDate)).toBe(false);
  });

  it("adds conditional warnings when a controlling yes field is selected", () => {
    const values = {
      ...DEFAULT_FORM_VALUES,
      militaryService: true,
      vaEnrolled: null,

      employmentOnRelease: true,
      employer: null,
      employerContact: null,

      previousTransitionalHome: true,
      previousHomeName: null,
      previousHomeCity: null,
    };

    const warnings = computeWarningFields(values);

    expect(warnings.has(FIELD_KEYS.vaEnrolled)).toBe(true);
    expect(warnings.has(FIELD_KEYS.employer)).toBe(true);
    expect(warnings.has(FIELD_KEYS.employerContact)).toBe(true);
    expect(warnings.has(FIELD_KEYS.previousHomeName)).toBe(true);
    expect(warnings.has(FIELD_KEYS.previousHomeCity)).toBe(true);
  });

  it("warns when violence discharge description is missing after a yes response", () => {
    const values = {
      ...DEFAULT_FORM_VALUES,
      priorInvoluntaryDischarge: true,
      violenceDischargeDescription: null,
    };

    const warnings = computeWarningFields(values);

    expect(warnings.has(FIELD_KEYS.violenceDischargeDescription)).toBe(true);
  });

  it("flags expected optional empty fields for warning while allowing progress", () => {
    const warnings = computeWarningFields(DEFAULT_FORM_VALUES);

    expect(warnings.has(FIELD_KEYS.cmPoName)).toBe(true);
    expect(warnings.has(FIELD_KEYS.cmPoEmail)).toBe(true);
    expect(warnings.has(FIELD_KEYS.gender)).toBe(true);
    // Required now, so it blocks rather than warns.
    expect(warnings.has(FIELD_KEYS.legalCurrentStatus)).toBe(false);
    expect(warnings.has(FIELD_KEYS.medicalMhSupportNeeded)).toBe(true);
    expect(warnings.has(FIELD_KEYS.clientFullName)).toBe(false);
    expect(warnings.has(FIELD_KEYS.idocNumber)).toBe(false);
    expect(warnings.has(FIELD_KEYS.preferredDistrict)).toBe(false);
    expect(warnings.has(FIELD_KEYS.signatureProvided)).toBe(false);
  });

  it("does not add conditional follow-up warnings when the controlling answer is not Yes", () => {
    const warnings = computeWarningFields({
      ...DEFAULT_FORM_VALUES,
      militaryService: false,
      vaEnrolled: null,
      employmentOnRelease: null,
      employer: null,
      childVisitationRequired: false,
      childFamilyServicesDocumentation: [],
      priorInvoluntaryDischarge: false,
      violenceHistoryDors: false,
      violenceDischargeDescription: null,
    });

    expect(warnings.has(FIELD_KEYS.vaEnrolled)).toBe(false);
    expect(warnings.has(FIELD_KEYS.employer)).toBe(false);
    expect(warnings.has(FIELD_KEYS.childFamilyServicesDocumentation)).toBe(
      false,
    );
    expect(warnings.has(FIELD_KEYS.violenceDischargeDescription)).toBe(false);
  });

  it("warns for child visitation follow-ups only when visitation is required", () => {
    const withoutYes = computeWarningFields({
      ...DEFAULT_FORM_VALUES,
      childVisitationRequired: null,
      parentGuardianNames: null,
      child1Info: null,
      childFamilyServicesDocumentation: [],
    });
    expect(withoutYes.has(FIELD_KEYS.parentGuardianNames)).toBe(false);

    const withYes = computeWarningFields({
      ...DEFAULT_FORM_VALUES,
      childVisitationRequired: true,
      parentGuardianNames: null,
      child1Info: null,
      childFamilyServicesDocumentation: [],
    });
    expect(withYes.has(FIELD_KEYS.parentGuardianNames)).toBe(true);
    expect(withYes.has(FIELD_KEYS.child1Info)).toBe(true);
    expect(withYes.has(FIELD_KEYS.childFamilyServicesDocumentation)).toBe(true);
  });
});

describe("isDateValid", () => {
  it("accepts valid MM/DD/YYYY and ISO dates", () => {
    expect(isDateValid("06/15/1991")).toBe(true);
    expect(isDateValid("1991-06-15")).toBe(true);
  });

  it("rejects empty or impossible dates", () => {
    expect(isDateValid("")).toBe(false);
    expect(isDateValid("02/30/2020")).toBe(false);
    expect(isDateValid("not-a-date")).toBe(false);
  });
});

describe("getErrorForField", () => {
  it("returns the first message for a field", () => {
    expect(getErrorForField([{ dob: ["Date is required"] }], "dob")).toBe(
      "Date is required",
    );
  });

  it("returns undefined when errors are missing", () => {
    expect(getErrorForField(undefined, "dob")).toBeUndefined();
  });
});

describe("normalizeDefaultValues", () => {
  it("formats extracted phone fields and pads preferred provider slots", () => {
    const normalized = normalizeDefaultValues({
      ...DEFAULT_FORM_VALUES,
      age: 0,
      cmPoPhone: "2085550111",
      personalPhoneNumber: "2085551234",
      emergencyContactPhone: "2085550199",
      employerContact: "2085550177",
      preferredProviders: ["Provider One"],
    });

    expect(normalized.cmPoPhone).toBe("208-555-0111");
    expect(normalized.personalPhoneNumber).toBe("208-555-1234");
    expect(normalized.emergencyContactPhone).toBe("208-555-0199");
    expect(normalized.employerContact).toBe("208-555-0177");
    expect(normalized.age).toBeNull();
    expect(normalized.preferredProviders).toEqual(["Provider One", "", ""]);
  });
});

describe("normalizeExtractedPhoneFields", () => {
  it("coalesces null OCR text fields to empty strings while formatting phones", () => {
    const extractedValues = {
      ...DEFAULT_FORM_VALUES,
      cmPoPhone: "2085550111",
      cmPoName: null,
      clientFullName: null,
    } as unknown as Parameters<typeof normalizeExtractedPhoneFields>[0];

    const normalized = normalizeExtractedPhoneFields(extractedValues);

    expect(normalized.cmPoPhone).toBe("208-555-0111");
    expect(normalized.cmPoName).toBe("");
    expect(normalized.clientFullName).toBe("");
  });
});
