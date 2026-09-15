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

describe("facilitiesOffered", () => {
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

  test("drops a blank name left by a stray comma", () => {
    expect(
      processProgram(buildRow({ facilitiesOffered: ["MCI-Concord", ""] }))
        .facilitiesOffered,
    ).toEqual(["MCI-Concord"]);
  });
});

describe("eligibilityRequirements", () => {
  test.each(["None", ""])("is empty for %j", (value) => {
    expect(
      processProgram(buildRow({ eligibilityRequirements: value }))
        .eligibilityRequirements,
    ).toEqual([]);
  });

  test("capitalizes a single requirement", () => {
    expect(
      processProgram(buildRow({ eligibilityRequirements: "must have GED/HSD" }))
        .eligibilityRequirements,
    ).toEqual(["Must have GED/HSD"]);
  });

  test("splits on semicolons", () => {
    expect(
      processProgram(
        buildRow({
          eligibilityRequirements: "must have GED/HSD; over 18 years old",
        }),
      ).eligibilityRequirements,
    ).toEqual(["Must have GED/HSD", "Over 18 years old"]);
  });

  test("ignores a trailing conjunction", () => {
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
  test.each(["None", "", undefined])("is undefined for %j", (value) => {
    expect(
      processProgram(buildRow({ prerequisites: value })).prerequisites,
    ).toBeUndefined();
  });

  test("passes through a real prerequisite as written", () => {
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

describe("translation", () => {
  test("supplies display copy", () => {
    const program = processProgram(
      buildRow(),
      buildRow({
        title: "Alfabetización básica",
        description: "Instrucción de alfabetización.",
        abbreviatedDescription: "Alfabetización.",
      }),
    );

    expect(program).toMatchObject({
      title: "Alfabetización básica",
      description: "Instrucción de alfabetización.",
      abbreviatedDescription: "Alfabetización.",
    });
  });

  test("falls back to English for a blank cell", () => {
    expect(processProgram(buildRow(), buildRow({ title: "" })).title).toBe(
      "Basic Literacy",
    );
  });

  test("never overrides untranslatable columns", () => {
    const program = processProgram(
      buildRow({ programId: "MA-0001", numberOfDaysThatCanBeEarned: 30 }),
      buildRow({ programId: "MA-0001", numberOfDaysThatCanBeEarned: 99 }),
    );

    expect(program).toMatchObject({
      programId: "MA-0001",
      numberOfDaysThatCanBeEarned: 30,
    });
  });

  test("supplies the translated category", () => {
    expect(
      processProgram(buildRow(), buildRow({ category: "Educación" })).category,
    ).toBe("Educación");
  });

  test("falls back to English for a blank category", () => {
    expect(
      processProgram(buildRow(), buildRow({ category: "" })).category,
    ).toBe("Education");
  });

  test("supplies the translated facility names", () => {
    expect(
      processProgram(
        buildRow({
          facilitiesOffered: ["MCI-Shirley", "Old Colony Correctional Center"],
        }),
        buildRow({
          facilitiesOffered: ["MCI-Shirley", "Centro Penitenciario Old Colony"],
        }),
      ).facilitiesOffered,
    ).toEqual(["MCI-Shirley", "Centro Penitenciario Old Colony"]);
  });

  test("falls back to English for a completely blank facilitiesOffered cell", () => {
    expect(
      processProgram(buildRow(), buildRow({ facilitiesOffered: [""] }))
        .facilitiesOffered,
    ).toEqual(["MCI-Concord", "MCI-Shirley"]);
  });

  test("hides a facility the translated list leaves out", () => {
    expect(
      processProgram(
        buildRow({
          facilitiesOffered: ["Old Colony Correctional Center", "MCI-Shirley"],
        }),
        buildRow({ facilitiesOffered: ["Centro Penitenciario Old Colony"] }),
      ).facilitiesOffered,
    ).toEqual(["Centro Penitenciario Old Colony"]);
  });

  test("leaves the all-facilities check to English", () => {
    const program = processProgram(
      buildRow({ facilitiesOffered: ["All facilities"] }),
      buildRow({ facilitiesOffered: ["MCI-Shirley"] }),
    );

    expect(program.availableAtAllFacilities).toBe(true);
    expect(program.facilitiesOffered).toEqual([]);
  });

  test("leaves the requirements check to English", () => {
    expect(
      processProgram(
        buildRow({ eligibilityRequirements: "None" }),
        buildRow({ eligibilityRequirements: "Debe tener GED/HSD" }),
      ).eligibilityRequirements,
    ).toEqual([]);
  });

  test("supplies the requirement text", () => {
    expect(
      processProgram(
        buildRow({ eligibilityRequirements: "must have GED/HSD; over 18" }),
        buildRow({
          eligibilityRequirements: "debe tener GED/HSD; mayor de 18 años",
        }),
      ).eligibilityRequirements,
    ).toEqual(["Debe tener GED/HSD", "Mayor de 18 años"]);
  });
});
