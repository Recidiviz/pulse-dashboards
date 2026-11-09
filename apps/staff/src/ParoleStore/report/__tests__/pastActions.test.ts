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

import { PastActionsInput } from "~datatypes";

import { resolvePastActions } from "../pastActions";

// The schema's own type, so a schema change that no longer fits the Past
// Actions config fails the type check here.
type Input = PastActionsInput;
type RowEntry = NonNullable<Input["rows"]>[string];

const EDITED_AT = new Date("2026-11-02T15:00:00Z");

const phiEdit = <T>(value: T | null) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

// Ids in the order the PHI added the rows, as newPhiRowId makes them.
const FIRST = "phi_1793800000000_a1b2c3d4";
const SECOND = "phi_1793800060000_e5f6a7b8";
const THIRD = "phi_1793800120000_c9d0e1f2";
const FOURTH = "phi_1793800180000_a3b4c5d6";

const pastAction = (fields: {
  date?: string | null;
  notes?: string | null;
}): RowEntry => ({
  source: "PHI",
  fields: {
    ...(fields.date !== undefined && { date: phiEdit(fields.date) }),
    ...(fields.notes !== undefined && { notes: phiEdit(fields.notes) }),
  },
});

const resolvedIds = (input: Input) =>
  resolvePastActions(input).rows.map((row) => row.id);

describe("resolvePastActions", () => {
  it("has no rows before the PHI adds one", () => {
    expect(resolvePastActions(undefined).rows).toEqual([]);
    expect(resolvePastActions({}).rows).toEqual([]);
  });

  it("shows a row the PHI added before it has values, so they can fill it in", () => {
    expect(
      resolvePastActions({ rows: { [FIRST]: { source: "PHI" } } }).rows,
    ).toEqual([
      {
        id: FIRST,
        status: "ADDED_BY_PHI",
        label: null,
        fields: {
          date: {
            value: null,
            source: "ATLAS",
            atlasValue: null,
            editedBy: null,
            editedAt: null,
          },
          notes: {
            value: null,
            source: "ATLAS",
            atlasValue: null,
            editedBy: null,
            editedAt: null,
          },
        },
      },
    ]);
  });

  it("shows the PHI's date and notes, with who entered them", () => {
    const [row] = resolvePastActions({
      rows: {
        [FIRST]: pastAction({
          date: "2015-03",
          notes: "Sentenced, entered custody",
        }),
      },
    }).rows;

    expect(row.fields.date).toEqual({
      value: "2015-03",
      source: "PHI",
      atlasValue: null,
      editedBy: "phi@us_id.gov",
      editedAt: EDITED_AT,
    });
    expect(row.fields.notes.value).toBe("Sentenced, entered custody");
  });

  it("shows rows oldest first, whatever order the PHI added them in", () => {
    expect(
      resolvedIds({
        rows: {
          [FIRST]: pastAction({ date: "2019-06" }),
          [SECOND]: pastAction({ date: "2015-03" }),
          [THIRD]: pastAction({ date: "2017-11" }),
        },
      }),
    ).toEqual([SECOND, THIRD, FIRST]);
  });

  it("puts rows without a date after the dated ones, in the order the PHI added them", () => {
    expect(
      resolvedIds({
        rows: {
          [THIRD]: { source: "PHI" },
          [FIRST]: pastAction({ notes: "Escaped from a work release center" }),
          [FOURTH]: pastAction({ date: "2012-01" }),
          [SECOND]: pastAction({ date: "2015-03" }),
        },
      }),
    ).toEqual([FOURTH, SECOND, FIRST, THIRD]);
  });

  it("keeps rows with the same month in the order the PHI added them", () => {
    expect(
      resolvedIds({
        rows: {
          [SECOND]: pastAction({ date: "2015-03", notes: "Entered custody" }),
          [FIRST]: pastAction({ date: "2015-03", notes: "Sentenced" }),
        },
      }),
    ).toEqual([FIRST, SECOND]);
  });

  it("moves a row to its new place when the PHI changes its date", () => {
    const rows = {
      [FIRST]: pastAction({ date: "2015-03" }),
      [SECOND]: pastAction({ date: "2019-06" }),
    };

    expect(resolvedIds({ rows })).toEqual([FIRST, SECOND]);
    expect(
      resolvedIds({
        rows: { ...rows, [FIRST]: pastAction({ date: "2020-01" }) },
      }),
    ).toEqual([SECOND, FIRST]);
  });

  it("keeps a row whose date the PHI cleared, with the undated rows", () => {
    const { rows } = resolvePastActions({
      rows: {
        [FIRST]: pastAction({ date: null, notes: "Granted parole" }),
        [SECOND]: pastAction({ date: "2015-03" }),
      },
    });

    expect(rows.map((row) => row.id)).toEqual([SECOND, FIRST]);
    expect(rows[1].fields.date.value).toBeNull();
    expect(rows[1].fields.date.source).toBe("PHI");
  });
});
