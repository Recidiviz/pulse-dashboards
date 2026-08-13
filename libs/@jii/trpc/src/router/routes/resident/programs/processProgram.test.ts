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

import { processProgram } from "./processProgram";
import { ProgramFromSheet } from "./schema";

function buildRow(overrides: Partial<ProgramFromSheet> = {}): ProgramFromSheet {
  return {
    programId: "MA-0001",
    category: "Education",
    title: "Basic Literacy",
    description: "Literacy instruction.",
    facilitiesOffered: ["MCI-Concord", "MCI-Shirley"],
    eligibilityRequirements: "None",
    ...overrides,
  };
}

describe("category", () => {
  test("is keyed and labeled with the sheet value", () => {
    expect(processProgram(buildRow()).category).toEqual({
      key: "Education",
      label: "Education",
    });
  });
});

describe("facilitiesOffered", () => {
  test("each facility is keyed and labeled with the sheet value", () => {
    expect(processProgram(buildRow()).facilitiesOffered).toEqual([
      { key: "MCI-Concord", label: "MCI-Concord" },
      { key: "MCI-Shirley", label: "MCI-Shirley" },
    ]);
  });
});

describe("availableAtAllFacilities", () => {
  test("is false when facilities are named", () => {
    expect(processProgram(buildRow()).availableAtAllFacilities).toBe(false);
  });

  test("is true for the magic value, and no facilities are listed", () => {
    const program = processProgram(
      buildRow({ facilitiesOffered: ["All facilities"] }),
    );

    expect(program.availableAtAllFacilities).toBe(true);
    expect(program.facilitiesOffered).toEqual([]);
  });
});

describe("eligibilityRequirements", () => {
  test.each(["None", ""])("%j means no requirements", (value) => {
    expect(
      processProgram(buildRow({ eligibilityRequirements: value }))
        .eligibilityRequirements,
    ).toEqual([]);
  });

  test("a single requirement is capitalized", () => {
    expect(
      processProgram(buildRow({ eligibilityRequirements: "must have GED/HSD" }))
        .eligibilityRequirements,
    ).toEqual(["Must have GED/HSD"]);
  });

  test("requirements are split on semicolons", () => {
    expect(
      processProgram(
        buildRow({
          eligibilityRequirements: "must have GED/HSD; over 18 years old",
        }),
      ).eligibilityRequirements,
    ).toEqual(["Must have GED/HSD", "Over 18 years old"]);
  });

  test("a trailing conjunction is not treated as part of a requirement", () => {
    expect(
      processProgram(
        buildRow({
          eligibilityRequirements: "must have GED/HSD; and over 18 years old",
        }),
      ).eligibilityRequirements,
    ).toEqual(["Must have GED/HSD", "Over 18 years old"]);
  });
});

describe("prerequisites", () => {
  test.each(["None", "", undefined])("%j means no prerequisite", (value) => {
    expect(
      processProgram(buildRow({ prerequisites: value })).prerequisites,
    ).toBeUndefined();
  });

  test("a prerequisite is passed through as written", () => {
    expect(
      processProgram(buildRow({ prerequisites: "must have GED/HSD" }))
        .prerequisites,
    ).toBe("must have GED/HSD");
  });
});

describe("columns processProgram leaves alone", () => {
  test("pass through unchanged", () => {
    const row = buildRow({
      abbreviatedDescription: "Literacy.",
      dateAddedOrUpdated: new Date("2026-01-16"),
      numberOfDaysThatCanBeEarned: 30,
    });

    expect(processProgram(row)).toMatchObject({
      programId: row.programId,
      title: row.title,
      description: row.description,
      abbreviatedDescription: row.abbreviatedDescription,
      dateAddedOrUpdated: row.dateAddedOrUpdated,
      numberOfDaysThatCanBeEarned: row.numberOfDaysThatCanBeEarned,
    });
  });
});
