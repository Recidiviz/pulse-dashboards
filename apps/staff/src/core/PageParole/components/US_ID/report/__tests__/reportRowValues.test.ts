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
  editedRowChanges,
  keepsAValue,
  newRowChanges,
  ReportRowValues,
  resolveSavedNewRow,
} from "../reportRowValues";

type Fields = { date: string; notes: string; age: number };

const blank: ReportRowValues<Fields> = { date: null, notes: null, age: null };

const saved: ReportRowValues<Fields> = {
  date: "2015-03",
  notes: "Sentenced, entered custody",
  age: null,
};

describe("resolveSavedNewRow", () => {
  it("resolves the saved fields as the PHI's and leaves the rest empty", () => {
    const empty = {
      value: null,
      source: "ATLAS",
      atlasValue: null,
      editedBy: null,
      editedAt: null,
    };

    expect(resolveSavedNewRow("phi_1", blank, { notes: "Paroled" })).toEqual({
      id: "phi_1",
      status: "ADDED_BY_PHI",
      label: null,
      fields: {
        date: empty,
        notes: { ...empty, value: "Paroled", source: "PHI" },
        age: empty,
      },
    });
  });
});

describe("newRowChanges", () => {
  it("returns only the fields the PHI filled in, with text trimmed", () => {
    expect(newRowChanges({ ...blank, notes: "  Paroled  ", age: 0 })).toEqual({
      notes: "Paroled",
      age: 0,
    });
  });

  it("returns nothing for a row of blank text", () => {
    expect(newRowChanges({ ...blank, notes: "   " })).toEqual({});
  });
});

describe("editedRowChanges", () => {
  it("returns only the fields the PHI changed", () => {
    expect(editedRowChanges(saved, { ...saved, notes: "Paroled" })).toEqual({
      notes: "Paroled",
    });
  });

  it("returns null for a field the PHI cleared or emptied", () => {
    expect(
      editedRowChanges(saved, { ...saved, date: null, notes: "  " }),
    ).toEqual({ date: null, notes: null });
  });

  it("doesn't count a saved value's stray spaces as a change, as an Atlas value might have", () => {
    const atlas = { ...saved, notes: "Escape " };

    expect(editedRowChanges(atlas, atlas)).toEqual({});
    expect(
      editedRowChanges({ ...saved, notes: "" }, { ...saved, notes: "" }),
    ).toEqual({});
  });

  it("doesn't count added spaces as a change", () => {
    expect(
      editedRowChanges(saved, {
        ...saved,
        notes: "Sentenced, entered custody ",
      }),
    ).toEqual({});
  });
});

describe("keepsAValue", () => {
  it("is true while any field keeps a value", () => {
    expect(keepsAValue(saved, { date: null })).toBe(true);
  });

  it("is false when the changes clear every field", () => {
    expect(keepsAValue(saved, { date: null, notes: null })).toBe(false);
  });
});
