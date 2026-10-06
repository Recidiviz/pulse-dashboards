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

import {
  decodeAnnotationResults,
  findBadGrades,
  parseLabelConfig,
} from "~@meetings/tasks/admin/label-studio-annotations";
import type { LabelStudioResult } from "~@meetings/tasks/label-studio-client";

const CONFIG_XML = `
<View>
  <Text name="case_note_display" value="$case_note"/>
  <Choices name="case_note_accuracy" toName="case_note_display" choice="single">
    <Choice value="Accurate" alias="GOOD"/>
    <Choice value="Partially accurate" alias="PARTIAL"/>
    <Choice value="Inaccurate" alias="BAD"/>
  </Choices>
  <TextArea name="case_note_notes" toName="case_note_display" />
  <Text name="action_items_display" value="$action_items"/>
  <Choices name="action_items_accuracy" toName="action_items_display">
    <Choice value="GOOD"/>
    <Choice value="BAD"/>
  </Choices>
</View>
`;

function choice(fromName: string, value: string): LabelStudioResult {
  return { from_name: fromName, type: "choices", value: { choices: [value] } };
}

function text(fromName: string, ...value: string[]): LabelStudioResult {
  return { from_name: fromName, type: "textarea", value: { text: value } };
}

describe("parseLabelConfig", () => {
  test("reads choice fields with their aliases", () => {
    const config = parseLabelConfig(CONFIG_XML);

    const caseNote = config.choiceFields.find(
      (f) => f.name === "case_note_accuracy",
    );
    expect(caseNote?.toName).toBe("case_note_display");
    expect(caseNote?.aliasByValue.get("Inaccurate")).toBe("BAD");
  });

  test("maps a choice with no alias to its own literal value", () => {
    const config = parseLabelConfig(CONFIG_XML);

    const actionItems = config.choiceFields.find(
      (f) => f.name === "action_items_accuracy",
    );
    expect(actionItems?.aliasByValue.get("BAD")).toBe("BAD");
  });

  test("reads self-closing TextArea fields", () => {
    const config = parseLabelConfig(CONFIG_XML);

    expect(config.textFields).toContainEqual({
      name: "case_note_notes",
      toName: "case_note_display",
    });
  });
});

describe("decodeAnnotationResults", () => {
  const config = parseLabelConfig(CONFIG_XML);

  test("resolves a stored literal value to its alias", () => {
    const decoded = decodeAnnotationResults(config, [
      choice("case_note_accuracy", "Inaccurate"),
    ]);

    expect(decoded).toEqual([
      {
        fromName: "case_note_accuracy",
        toName: "case_note_display",
        value: "BAD",
      },
    ]);
  });

  test("passes through a value already stored as its alias", () => {
    // Annotations saved after an alias was added store the alias itself.
    const decoded = decodeAnnotationResults(config, [
      choice("case_note_accuracy", "BAD"),
    ]);

    expect(decoded[0].value).toBe("BAD");
  });

  test("keeps a field whose from_name is absent from the config", () => {
    // The config is edited live and has dropped fields before; an annotation
    // referencing a since-removed slot must not silently vanish.
    const decoded = decodeAnnotationResults(config, [
      choice("since_removed_field", "BAD"),
    ]);

    expect(decoded).toEqual([
      { fromName: "since_removed_field", toName: "unknown", value: "BAD" },
    ]);
  });

  test("joins multi-part text values", () => {
    const decoded = decodeAnnotationResults(config, [
      text("case_note_notes", "first", "second"),
    ]);

    expect(decoded[0].value).toBe("first\n\nsecond");
  });
});

describe("findBadGrades", () => {
  const config = parseLabelConfig(CONFIG_XML);

  test("pairs a BAD grade with notes sharing its toName", () => {
    const decoded = decodeAnnotationResults(config, [
      choice("case_note_accuracy", "Inaccurate"),
      text("case_note_notes", "invented a home visit"),
    ]);

    expect(findBadGrades(decoded)).toEqual([
      {
        fromName: "case_note_accuracy",
        toName: "case_note_display",
        notes: ["invented a home visit"],
      },
    ]);
  });

  test("ignores grades that aren't BAD", () => {
    const decoded = decodeAnnotationResults(config, [
      choice("case_note_accuracy", "Accurate"),
    ]);

    expect(findBadGrades(decoded)).toEqual([]);
  });

  test("does not attach notes from a different toName", () => {
    const decoded = decodeAnnotationResults(config, [
      choice("case_note_accuracy", "Inaccurate"),
      text("action_items_notes", "unrelated note"),
    ]);

    expect(findBadGrades(decoded)[0].notes).toEqual([]);
  });

  test("treats an all-caps short note as a grade, not a note", () => {
    // Known limitation of the notes heuristic, pinned here so a change to
    // isGradeLikeValue is a deliberate one.
    const decoded = decodeAnnotationResults(config, [
      choice("case_note_accuracy", "Inaccurate"),
      text("case_note_notes", "TODO"),
    ]);

    expect(findBadGrades(decoded)[0].notes).toEqual([]);
  });
});
