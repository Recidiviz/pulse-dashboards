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

import { PersonalHistoryInput } from "~datatypes";

import { resolvePersonalHistory } from "../personalHistory";

// The schema's own types, so a schema change that no longer fits the config
// fails the type check here.
type Input = PersonalHistoryInput;
type RowEntry = NonNullable<Input["rows"]>[string];

const EDITED_AT = new Date("2026-11-12T15:00:00Z");

const phiEdit = <T>(value: T | null) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

const NOT_ENTERED = {
  value: null,
  source: "ATLAS",
  atlasValue: null,
  editedBy: null,
  editedAt: null,
};

// Ids in the order the PHI added the rows, as newPhiRowId makes them.
const FIRST = "phi_1793800000000_a1b2c3d4";
const SECOND = "phi_1793800060000_e5f6a7b8";
const THIRD = "phi_1793800120000_c9d0e1f2";

const substanceRow = (fields: RowEntry["fields"]): RowEntry => ({
  source: "PHI",
  fields,
});

describe("resolvePersonalHistory", () => {
  it("shows every box empty and no substance rows before the PHI enters anything", () => {
    expect(resolvePersonalHistory(undefined)).toEqual({
      fields: {
        socialHistory: NOT_ENTERED,
        relationships: NOT_ENTERED,
        education: NOT_ENTERED,
        occupation: NOT_ENTERED,
        military: NOT_ENTERED,
        residentComments: NOT_ENTERED,
      },
      rows: [],
    });
    expect(resolvePersonalHistory({})).toEqual(
      resolvePersonalHistory(undefined),
    );
  });

  it("shows the PHI's text in its box, with who wrote it, and leaves the rest empty", () => {
    const { fields } = resolvePersonalHistory({
      fields: { education: phiEdit("Finished the 10th grade.") },
    });

    expect(fields.education).toEqual({
      value: "Finished the 10th grade.",
      source: "PHI",
      atlasValue: null,
      editedBy: "phi@us_id.gov",
      editedAt: EDITED_AT,
    });
    expect(fields.socialHistory).toEqual(NOT_ENTERED);
    expect(fields.residentComments).toEqual(NOT_ENTERED);
  });

  it("shows a box the PHI emptied as null, marked as theirs", () => {
    const { fields } = resolvePersonalHistory({
      fields: { military: phiEdit(null) },
    });

    expect(fields.military.value).toBeNull();
    expect(fields.military.source).toBe("PHI");
  });

  it("shows a substance row's values, with the age as a number", () => {
    const [row] = resolvePersonalHistory({
      rows: {
        [FIRST]: substanceRow({
          substance: phiEdit("Alcohol"),
          ageOfFirstUse: phiEdit(16),
          lastUse: phiEdit("2023-10"),
          heaviestUse: phiEdit("Most weekends"),
        }),
      },
    }).rows;

    expect(row.id).toBe(FIRST);
    expect(row.status).toBe("ADDED_BY_PHI");
    expect(row.fields.substance.value).toBe("Alcohol");
    expect(row.fields.ageOfFirstUse).toEqual({
      value: 16,
      source: "PHI",
      atlasValue: null,
      editedBy: "phi@us_id.gov",
      editedAt: EDITED_AT,
    });
    expect(row.fields.lastUse.value).toBe("2023-10");
    expect(row.fields.heaviestUse.value).toBe("Most weekends");
  });

  it("leaves a field the PHI hasn't filled in on a row empty", () => {
    const [row] = resolvePersonalHistory({
      rows: {
        [FIRST]: substanceRow({ substance: phiEdit("Methamphetamine") }),
      },
    }).rows;

    expect(row.fields.ageOfFirstUse).toEqual(NOT_ENTERED);
    expect(row.fields.lastUse).toEqual(NOT_ENTERED);
  });

  it("shows substance rows in the order the PHI added them, whatever their values", () => {
    const { rows } = resolvePersonalHistory({
      rows: {
        [THIRD]: substanceRow({
          substance: phiEdit("Alcohol"),
          lastUse: phiEdit("2015-01"),
        }),
        [FIRST]: substanceRow({
          substance: phiEdit("Opioids"),
          lastUse: phiEdit("2023-10"),
        }),
        [SECOND]: { source: "PHI" },
      },
    });

    expect(rows.map((row) => row.id)).toEqual([FIRST, SECOND, THIRD]);
  });
});
