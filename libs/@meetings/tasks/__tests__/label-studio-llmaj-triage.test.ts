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

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  LLMAJ_TRIAGE_RESULT_FIELDS,
  LLMAJ_TRIAGE_SECTIONS,
  LlmajTriageTaskSchema,
  LlmajTriageVerdictSchema,
} from "~@meetings/tasks/label-studio-llmaj-triage";

// The same file a template author imports into Label Studio to preview the
// labeling config, so it must stay valid against the schema.
const exampleTask: Record<string, unknown> = JSON.parse(
  readFileSync(
    new URL("../label-studio/llmaj-triage-example-task.json", import.meta.url),
    "utf8",
  ),
);

describe("LlmajTriageTaskSchema", () => {
  test("accepts the example task", () => {
    expect(LlmajTriageTaskSchema.safeParse(exampleTask).error).toBeUndefined();
  });

  test("rejects a flag that disagrees with the judge's grade", () => {
    const result = LlmajTriageTaskSchema.safeParse({
      ...exampleTask,
      action_items_flagged: true,
    });
    expect(result.error?.issues.map((i) => i.path)).toEqual([
      ["action_items_flagged"],
    ]);
  });

  test("rejects a task with no BAD section", () => {
    const result = LlmajTriageTaskSchema.safeParse({
      ...exampleTask,
      case_note_flagged: false,
      judge_case_note_grade: "PARTIAL",
      overall_flagged: false,
      judge_overall_grade: "Not available",
    });
    expect(result.error?.issues.map((i) => i.path)).toEqual([
      ["review_reason"],
    ]);
  });

  test("rejects a null displayed field, which Label Studio cannot import", () => {
    const result = LlmajTriageTaskSchema.safeParse({
      ...exampleTask,
      judge_action_items_omissions: null,
    });
    expect(result.success).toBe(false);
  });

  test("rejects an empty findings string", () => {
    const result = LlmajTriageTaskSchema.safeParse({
      ...exampleTask,
      judge_case_note_omissions: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("LlmajTriageVerdictSchema", () => {
  test("accepts a Not BAD verdict with a corrected grade", () => {
    expect(
      LlmajTriageVerdictSchema.safeParse({
        section: "CASE_NOTE",
        outcome: "NOT_BAD",
        correctedGrade: "PARTIAL",
        notes: "The start date is in the transcript at 12:40.",
      }).success,
    ).toBe(true);
  });

  test("rejects Not BAD without a corrected grade", () => {
    expect(
      LlmajTriageVerdictSchema.safeParse({
        section: "CASE_NOTE",
        outcome: "NOT_BAD",
      }).success,
    ).toBe(false);
  });

  test("rejects Other without notes", () => {
    expect(
      LlmajTriageVerdictSchema.safeParse({
        section: "ACTION_ITEMS",
        outcome: "OTHER",
        notes: "  ",
      }).success,
    ).toBe(false);
  });

  test("requires appliesTo on an Overall Confirmed BAD, allowing neither", () => {
    expect(
      LlmajTriageVerdictSchema.safeParse({
        section: "OVERALL",
        outcome: "CONFIRMED_BAD",
      }).success,
    ).toBe(false);
    expect(
      LlmajTriageVerdictSchema.safeParse({
        section: "OVERALL",
        outcome: "CONFIRMED_BAD",
        appliesTo: [],
      }).success,
    ).toBe(true);
  });

  test("rejects appliesTo outside an Overall verdict", () => {
    expect(
      LlmajTriageVerdictSchema.safeParse({
        section: "CASE_NOTE",
        outcome: "CONFIRMED_BAD",
        appliesTo: ["CASE_NOTE"],
      }).success,
    ).toBe(false);
  });
});

describe("field names", () => {
  test("every section's task fields exist in the schema", () => {
    const keys = Object.keys(LlmajTriageTaskSchema.innerType().shape);
    for (const { prefix } of LLMAJ_TRIAGE_SECTIONS) {
      expect(keys).toContain(`${prefix}_flagged`);
      expect(keys).toContain(`judge_${prefix}_grade`);
    }
  });

  test("result fields are prefixed by their section", () => {
    for (const { section, prefix } of LLMAJ_TRIAGE_SECTIONS) {
      for (const name of Object.values(LLMAJ_TRIAGE_RESULT_FIELDS[section])) {
        expect(name.startsWith(`${prefix}_`)).toBe(true);
      }
    }
  });
});
