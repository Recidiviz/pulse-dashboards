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

import { toFlatHousingApplicationData } from "../vertex.schema.mapper";
import { buildExtracted } from "./vertex.fixtures";

describe("toFlatHousingApplicationData", () => {
  it("flattens nested sections and formats ISO dates to MM/dd/yyyy", () => {
    const flat = toFlatHousingApplicationData(buildExtracted());

    expect(flat.clientFullName).toBe("Jane Doe");
    expect(flat.cmPoName).toBe("Casey Manager");
    expect(flat.dob).toBe("01/15/1985");
    expect(flat.tpdHousingNeededDate).toBe("08/01/2026");
    expect(flat.signatureDate).toBe("05/01/2026");
    expect(flat.gender).toBe("Female");
    expect(flat.legalCountyOfCrime).toBe("Ada");
    expect(flat.preferredDistrict).toEqual(["D3"]);
  });

  it("preserves already-client-formatted dates and nulls invalid ones", () => {
    expect(
      toFlatHousingApplicationData(
        buildExtracted({ dob: "03/04/1990", signatureDate: "not-a-date" }),
      ).dob,
    ).toBe("03/04/1990");
    expect(
      toFlatHousingApplicationData(
        buildExtracted({ signatureDate: "not-a-date" }),
      ).signatureDate,
    ).toBeNull();
  });

  it("normalizes gender labels and title-cases known counties", () => {
    const flat = toFlatHousingApplicationData(
      buildExtracted({ gender: "female", county: "ada" }),
    );
    expect(flat.gender).toBe("Female");
    expect(flat.legalCountyOfCrime).toBe("Ada");
  });

  it("throws on an unrecognized county of crime", () => {
    expect(() =>
      toFlatHousingApplicationData(buildExtracted({ county: "NotACounty" })),
    ).toThrow(/Invalid legalCountyOfCrime/);
  });

  it("normalizes preferredDistrict from a single string or array", () => {
    expect(
      toFlatHousingApplicationData(buildExtracted({ preferredDistrict: "D1" }))
        .preferredDistrict,
    ).toEqual(["D1"]);
    expect(
      toFlatHousingApplicationData(
        buildExtracted({ preferredDistrict: ["D1", "D2"] }),
      ).preferredDistrict,
    ).toEqual(["D1", "D2"]);
    expect(
      toFlatHousingApplicationData(buildExtracted({ preferredDistrict: "" }))
        .preferredDistrict,
    ).toEqual([]);
  });

  it("maps medical booleans into medicalAccommodations and strips confidence keys", () => {
    const flat = toFlatHousingApplicationData(
      buildExtracted({ gender: "Male", prescriptionMedication: true }),
    );

    expect(flat.medicalAccommodations).toContain("Prescription Medication");
    expect(
      (flat as unknown as Record<string, unknown>)["genderConfidence"],
    ).toBeUndefined();
  });
});
