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

import { STEP_VALIDATION_SCHEMA } from "../schema";

describe("STEP_VALIDATION_SCHEMA", () => {
  const step1 = STEP_VALIDATION_SCHEMA[1];
  const step2 = STEP_VALIDATION_SCHEMA[2];

  it("rejects invalid IDOC number format on step 1", () => {
    const result = step1.safeParse({
      clientFullName: "John Doe",
      idocNumber: "abc",
      dob: "06/15/1991",
      tpdHousingNeededDate: "07/01/2026",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.includes("idocNumber")),
      ).toBe(true);
    }
  });

  it("rejects missing required fields on step 1", () => {
    const result = step1.safeParse({
      clientFullName: "",
      idocNumber: null,
      dob: null,
      tpdHousingNeededDate: null,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid step 1 values", () => {
    const result = step1.safeParse({
      clientFullName: "John Doe",
      idocNumber: "123456",
      dob: "06/15/1991",
      legalCurrentStatus: "Termer",
      tpdHousingNeededDate: "07/01/2026",
    });

    expect(result.success).toBe(true);
  });

  it("requires Current Status (Q6) on step 1", () => {
    const result = step1.safeParse({
      clientFullName: "John Doe",
      idocNumber: "123456",
      dob: "06/15/1991",
      legalCurrentStatus: "",
      tpdHousingNeededDate: "07/01/2026",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["legalCurrentStatus"]);
    }
  });

  it("rejects step 2 when preferred district is empty", () => {
    const result = step2.safeParse({
      preferredDistrict: [],
      signatureProvided: true,
      signatureDate: "06/01/2026",
    });

    expect(result.success).toBe(false);
  });

  it("rejects step 2 when signature is not provided", () => {
    const result = step2.safeParse({
      preferredDistrict: ["D1"],
      signatureProvided: null,
      signatureDate: "06/01/2026",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.path.includes("signatureProvided"),
        ),
      ).toBe(true);
    }
  });

  it("accepts valid step 2 values", () => {
    const result = step2.safeParse({
      preferredDistrict: ["D1"],
      signatureProvided: true,
      signatureDate: "06/01/2026",
    });

    expect(result.success).toBe(true);
  });

  it("rejects step 2 when signature date is missing", () => {
    const result = step2.safeParse({
      preferredDistrict: ["D1"],
      signatureProvided: true,
      signatureDate: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.path.includes("signatureDate"),
        ),
      ).toBe(true);
    }
  });
});
