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

import { makeDetails, makeRater, withRaters } from "./detailsFixture";
import { gradeDisplay } from "./grades";
import { buildRatingsTable } from "./ratings";

describe("gradeDisplay", () => {
  it("maps grades to tones", () => {
    expect(gradeDisplay("GOOD")).toEqual({ label: "Good", tone: "good" });
    expect(gradeDisplay("PARTIAL").tone).toBe("partial");
    expect(gradeDisplay("BAD").tone).toBe("bad");
    expect(gradeDisplay(null)).toEqual({ label: "—", tone: "neutral" });
  });
});

describe("buildRatingsTable", () => {
  it("says Not sent without a Label Studio task", () => {
    const table = buildRatingsTable(makeDetails());
    expect(table.headers).toEqual(["Dimension", "LLM judge", "Label Studio"]);
    expect(table.rows[0].cells[1]).toEqual({ kind: "text", label: "Not sent" });
    expect(table.showCombineNote).toBe(false);
  });

  it("says Not rated yet for a task with no raters", () => {
    const table = buildRatingsTable(
      makeDetails({ labelStudio: withRaters([]) }),
    );
    expect(table.rows[0].cells[1]).toEqual({
      kind: "text",
      label: "Not rated yet",
    });
  });

  it("adds a column per rater and the override sub-label", () => {
    const table = buildRatingsTable(
      makeDetails({
        labelStudio: withRaters(
          [
            makeRater({ raterEmail: "alex@example.com" }),
            makeRater({
              raterEmail: "admin@recidiviz.org",
              isAuthoritative: true,
              grades: {
                overall: "GOOD",
                caseNote: "GOOD",
                actionItems: "GOOD",
              },
            }),
          ],
          {
            overall: {
              grade: "GOOD",
              worst: "BAD",
              overriddenByAuthoritative: true,
            },
            caseNote: {
              grade: "GOOD",
              worst: "BAD",
              overriddenByAuthoritative: true,
            },
            actionItems: {
              grade: "GOOD",
              worst: "GOOD",
              overriddenByAuthoritative: false,
            },
          },
        ),
      }),
    );
    expect(table.headers).toEqual([
      "Dimension",
      "LLM judge",
      "Label Studio",
      "alex",
      "admin (authoritative)",
    ]);
    expect(table.rows[0].cells[1]).toMatchObject({
      label: "Good",
      sub: "Admin override · worst was Bad",
    });
    expect(table.rows[2].cells[1]).toMatchObject({
      label: "Good",
      sub: undefined,
    });
    expect(table.showCombineNote).toBe(true);
  });

  it("shows the preferred provider's grade for the LLM transcript row", () => {
    const table = buildRatingsTable(makeDetails());
    expect(table.rows[3].cells[0]).toMatchObject({
      label: "Good",
      sub: "Deepgram preferred",
    });
  });
});
