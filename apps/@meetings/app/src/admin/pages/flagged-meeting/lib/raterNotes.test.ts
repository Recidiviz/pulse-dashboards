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

import { makeRater } from "./detailsFixture";
import { buildRaterItems } from "./raterNotes";

describe("buildRaterItems", () => {
  it("pairs notes with the grade field sharing their target", () => {
    const rater = makeRater({
      grades: { overall: "BAD", caseNote: "BAD" },
      transcriptGrade: null,
      fields: [
        { fromName: "overall_grade", toName: "overall", value: "BAD" },
        { fromName: "case_note_accuracy", toName: "case_note", value: "BAD" },
        {
          fromName: "case_note_notes",
          toName: "case_note",
          value: "Wrong date",
        },
        { fromName: "misc", toName: "elsewhere", value: "Something else" },
      ],
    });
    expect(buildRaterItems(rater)).toEqual([
      { label: "Overall", grade: "BAD", notes: [] },
      { label: "Case note", grade: "BAD", notes: ["Wrong date"] },
      { label: "General notes", grade: null, notes: ["Something else"] },
    ]);
  });

  it("does not treat N/A or short all-caps values as notes", () => {
    const rater = makeRater({
      grades: { caseNote: "N/A" },
      transcriptGrade: null,
      fields: [
        { fromName: "case_note_accuracy", toName: "case_note", value: "N/A" },
      ],
    });
    expect(buildRaterItems(rater)).toEqual([
      { label: "Case note", grade: "N/A", notes: [] },
    ]);
  });
});
