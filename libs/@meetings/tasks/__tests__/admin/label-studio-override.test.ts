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

import { parseLabelConfig } from "~@meetings/tasks/admin/label-studio-annotations";
import { withOverriddenGrade } from "~@meetings/tasks/admin/label-studio-override";
import type { LabelStudioResult } from "~@meetings/tasks/label-studio-client";

const CONFIG = parseLabelConfig(`
<View>
  <Text name="case_note_display" value="$case_note"/>
  <Choices name="case_note_accuracy" toName="case_note_display">
    <Choice value="Accurate" alias="GOOD"/>
    <Choice value="Partially accurate" alias="PARTIAL"/>
    <Choice value="Inaccurate" alias="BAD"/>
  </Choices>
  <TextArea name="case_note_notes" toName="case_note_display"/>
  <Text name="overall_display" value="$overall"/>
  <Choices name="overall_grade" toName="overall_display">
    <Choice value="GOOD"/>
    <Choice value="BAD"/>
  </Choices>
</View>`);

const caseNoteGrade = (choice: string): LabelStudioResult => ({
  from_name: "case_note_accuracy",
  to_name: "case_note_display",
  type: "choices",
  value: { choices: [choice] },
});

describe("withOverriddenGrade", () => {
  test("replaces the grade and keeps the rest of the result", () => {
    const notes: LabelStudioResult = {
      from_name: "case_note_notes",
      to_name: "case_note_display",
      type: "textarea",
      value: { text: ["kept"] },
    };

    const result = withOverriddenGrade({
      config: CONFIG,
      result: [caseNoteGrade("BAD"), notes],
      dimension: "caseNote",
      grade: "PARTIAL",
    });

    expect(result).toEqual([caseNoteGrade("PARTIAL"), notes]);
  });

  test("adds the grade when the annotation has none for that dimension", () => {
    const result = withOverriddenGrade({
      config: CONFIG,
      result: [],
      dimension: "caseNote",
      grade: "GOOD",
    });

    expect(result).toEqual([caseNoteGrade("GOOD")]);
  });

  test("throws when the config has no field for the dimension", () => {
    expect(() =>
      withOverriddenGrade({
        config: CONFIG,
        result: [],
        dimension: "actionItems",
        grade: "GOOD",
      }),
    ).toThrow(/no grade field for "actionItems"/);
  });

  test("throws when the field has no choice for the grade", () => {
    expect(() =>
      withOverriddenGrade({
        config: CONFIG,
        result: [],
        dimension: "overall",
        grade: "PARTIAL",
      }),
    ).toThrow(/no "PARTIAL" choice/);
  });
});
