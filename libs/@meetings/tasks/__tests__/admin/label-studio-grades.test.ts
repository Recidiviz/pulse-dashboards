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

import { describe, expect, test } from "vitest";

import type { DecodedField } from "~@meetings/tasks/admin/label-studio-annotations";
import {
  collapseTaskGrades,
  decodedFieldsToGrades,
  isEmptyActionItems,
  LS_AUTHORITATIVE_RATER_EMAIL,
  stripBlindActionItemsGrading,
  wasActionItemsGradedBlind,
  worstGrade,
} from "~@meetings/tasks/admin/label-studio-grades";

const TO_NAME = {
  caseNote: "case_note_display",
  actionItems: "action_items_display",
  overall: "overall_display",
  transcript: "transcript_display",
};

function field(fromName: string, toName: string, value: string): DecodedField {
  return { fromName, toName, value };
}

const caseNote = (value: string) =>
  field("case_note_accuracy", TO_NAME.caseNote, value);
const actionItems = (value: string) =>
  field("action_items_accuracy", TO_NAME.actionItems, value);
const overall = (value: string) =>
  field("overall_grade", TO_NAME.overall, value);
const transcript = (value: string) =>
  field("transcript_quality", TO_NAME.transcript, value);

describe("worstGrade", () => {
  test("picks the most severe grade", () => {
    expect(worstGrade("GOOD", "BAD", "PARTIAL")).toBe("BAD");
    expect(worstGrade("GOOD", "PARTIAL")).toBe("PARTIAL");
  });

  test("ranks N/A below GOOD, since it isn't a quality signal", () => {
    expect(worstGrade("N/A", "GOOD")).toBe("GOOD");
    expect(worstGrade("N/A")).toBe("N/A");
  });

  test("ignores ungraded dimensions", () => {
    expect(worstGrade(undefined, "PARTIAL", undefined)).toBe("PARTIAL");
    expect(worstGrade(undefined, undefined)).toBeUndefined();
  });
});

describe("decodedFieldsToGrades", () => {
  test("maps each known slot to its dimension", () => {
    expect(
      decodedFieldsToGrades([
        caseNote("GOOD"),
        actionItems("PARTIAL"),
        overall("BAD"),
      ]),
    ).toEqual({ caseNote: "GOOD", actionItems: "PARTIAL", overall: "BAD" });
  });

  test("ignores slots that aren't graded dimensions", () => {
    expect(decodedFieldsToGrades([transcript("BAD")])).toEqual({});
  });

  test("ignores free text in a grade slot", () => {
    expect(decodedFieldsToGrades([caseNote("some rater note")])).toEqual({});
  });

  test("reconstructs a missing overall as the worst graded dimension", () => {
    // Annotations predating the overall field, or where the rater skipped it,
    // would otherwise drop out of the Overall breakdown entirely.
    expect(
      decodedFieldsToGrades([caseNote("GOOD"), actionItems("BAD")]),
    ).toEqual({ caseNote: "GOOD", actionItems: "BAD", overall: "BAD" });
  });

  test("leaves overall unset when nothing was graded", () => {
    expect(decodedFieldsToGrades([])).toEqual({});
  });
});

describe("isEmptyActionItems", () => {
  test.each([
    [null, true],
    [undefined, true],
    ["", true],
    ["   ", true],
    [[], true],
    ["[Client] Call the office", false],
    [["[Client] Call the office"], false],
  ])("%p -> %p", (value, expected) => {
    expect(isEmptyActionItems(value)).toBe(expected);
  });
});

describe("wasActionItemsGradedBlind", () => {
  const duringBug = new Date("2026-07-01T00:00:00Z");
  const afterFix = new Date("2026-09-01T00:00:00Z");

  test("blank action items graded during the bug window counts as blind", () => {
    expect(
      wasActionItemsGradedBlind({
        taskActionItems: null,
        annotationCreatedAt: duringBug,
      }),
    ).toBe(true);
  });

  test("blank action items graded after the fix does NOT count as blind", () => {
    // formatLabelStudioActionItems legitimately returns null for a meeting
    // that generated no action items, so post-fix blankness is a real signal
    // and the rater's grade has to stand.
    expect(
      wasActionItemsGradedBlind({
        taskActionItems: null,
        annotationCreatedAt: afterFix,
      }),
    ).toBe(false);
  });

  test("populated action items never count as blind, whenever graded", () => {
    expect(
      wasActionItemsGradedBlind({
        taskActionItems: "[Client] Call the office",
        annotationCreatedAt: duringBug,
      }),
    ).toBe(false);
  });

  test("an annotation exactly at the fix instant is not blind", () => {
    expect(
      wasActionItemsGradedBlind({
        taskActionItems: null,
        annotationCreatedAt: new Date("2026-08-20T22:16:00Z"),
      }),
    ).toBe(false);
  });
});

describe("stripBlindActionItemsGrading", () => {
  test("drops the action-items grade and rewrites overall to the case note", () => {
    const { evaluatedFields, ignoredFromName } = stripBlindActionItemsGrading([
      caseNote("GOOD"),
      actionItems("BAD"),
      overall("BAD"),
    ]);

    expect(ignoredFromName).toBe("action_items_accuracy");
    expect(decodedFieldsToGrades(evaluatedFields)).toEqual({
      caseNote: "GOOD",
      overall: "GOOD",
    });
  });

  test("drops notes attached to the action-items field too", () => {
    const { evaluatedFields } = stripBlindActionItemsGrading([
      caseNote("GOOD"),
      actionItems("BAD"),
      field("action_items_notes", TO_NAME.actionItems, "missed a referral"),
    ]);

    expect(evaluatedFields.map((f) => f.fromName)).toEqual([
      "case_note_accuracy",
    ]);
  });

  test("keeps a BAD overall that a BAD transcript grade corroborates", () => {
    // Otherwise a meeting with a genuinely bad transcript silently drops out
    // of the Original overall-score view just for landing in the bug window.
    const { evaluatedFields } = stripBlindActionItemsGrading([
      caseNote("GOOD"),
      actionItems("BAD"),
      overall("BAD"),
      transcript("BAD"),
    ]);

    expect(decodedFieldsToGrades(evaluatedFields).overall).toBe("BAD");
  });

  test("is a no-op when the annotation has no action-items field", () => {
    const fields = [caseNote("BAD"), overall("BAD")];
    const { evaluatedFields, ignoredFromName } =
      stripBlindActionItemsGrading(fields);

    expect(ignoredFromName).toBeNull();
    expect(evaluatedFields).toBe(fields);
  });
});

describe("collapseTaskGrades", () => {
  const other = "rater@example.com";

  test("takes the worst grade across raters", () => {
    expect(
      collapseTaskGrades([
        { raterEmail: other, grades: { caseNote: "GOOD" } },
        { raterEmail: "second@example.com", grades: { caseNote: "BAD" } },
      ]),
    ).toEqual({ caseNote: "BAD" });
  });

  test("the authoritative rater overrides a worse grade outright", () => {
    expect(
      collapseTaskGrades([
        { raterEmail: other, grades: { caseNote: "BAD" } },
        {
          raterEmail: LS_AUTHORITATIVE_RATER_EMAIL,
          grades: { caseNote: "GOOD" },
        },
      ]),
    ).toEqual({ caseNote: "GOOD" });
  });

  test("the authoritative rater's email is matched case-insensitively", () => {
    expect(
      collapseTaskGrades([
        { raterEmail: other, grades: { caseNote: "BAD" } },
        {
          raterEmail: LS_AUTHORITATIVE_RATER_EMAIL.toUpperCase(),
          grades: { caseNote: "GOOD" },
        },
      ]),
    ).toEqual({ caseNote: "GOOD" });
  });

  test("falls back to worst-across-raters on dimensions the authoritative rater skipped", () => {
    expect(
      collapseTaskGrades([
        { raterEmail: other, grades: { caseNote: "BAD", actionItems: "BAD" } },
        {
          raterEmail: LS_AUTHORITATIVE_RATER_EMAIL,
          grades: { caseNote: "GOOD" },
        },
      ]),
    ).toEqual({ caseNote: "GOOD", actionItems: "BAD" });
  });

  test("leaves a dimension nobody graded unset", () => {
    expect(
      collapseTaskGrades([{ raterEmail: other, grades: { caseNote: "GOOD" } }]),
    ).toEqual({ caseNote: "GOOD" });
  });
});
