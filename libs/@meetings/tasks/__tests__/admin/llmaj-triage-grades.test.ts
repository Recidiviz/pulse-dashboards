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
  collapseLlmajTriageGrades,
  decodeLlmajTriageAnnotation,
  isLlmajTriageGradedBad,
  isLlmajTriageTaskGradedBad,
  type LlmajTriageSectionResult,
  type LlmajTriageTaskFlags,
} from "~@meetings/tasks/admin/llmaj-triage-grades";

const AUTHORITATIVE = "admin@recidiviz.org";

function field(fromName: string, value: string): DecodedField {
  return { fromName, toName: "irrelevant", value };
}

const caseNoteGrade = (value: string) => field("case_note_rater_grade", value);
const caseNoteAccuracy = (value: string) =>
  field("case_note_findings_accuracy", value);
const caseNoteNotes = (value: string) => field("case_note_notes", value);
const actionItemsGrade = (value: string) =>
  field("action_items_rater_grade", value);
const overallGrade = (value: string) => field("overall_rater_grade", value);
const overallAppliesTo = (value: string) => field("overall_applies_to", value);

function flags(
  overrides: Partial<LlmajTriageTaskFlags> = {},
): LlmajTriageTaskFlags {
  return {
    case_note_flagged: false,
    action_items_flagged: false,
    overall_flagged: false,
    ...overrides,
  };
}

function sectionResult(
  overrides: Partial<LlmajTriageSectionResult> = {},
): LlmajTriageSectionResult {
  return {
    section: "CASE_NOTE",
    flagged: false,
    grade: null,
    findingsAccuracy: null,
    notes: null,
    appliesTo: null,
    verdict: null,
    ...overrides,
  };
}

describe("decodeLlmajTriageAnnotation", () => {
  test("decodes a BAD grade on a flagged section into a Confirmed BAD verdict", () => {
    const [caseNote] = decodeLlmajTriageAnnotation(
      [
        caseNoteGrade("BAD"),
        caseNoteAccuracy("ALL_ACCURATE"),
        caseNoteNotes("Invented a court date."),
      ],
      flags({ case_note_flagged: true }),
    );
    expect(caseNote).toEqual({
      section: "CASE_NOTE",
      flagged: true,
      grade: "BAD",
      findingsAccuracy: "ALL_ACCURATE",
      notes: "Invented a court date.",
      appliesTo: null,
      verdict: {
        section: "CASE_NOTE",
        outcome: "CONFIRMED_BAD",
        notes: "Invented a court date.",
      },
    });
  });

  test("decodes GOOD or PARTIAL on a flagged section into Not BAD with that corrected grade", () => {
    const [partial] = decodeLlmajTriageAnnotation(
      [caseNoteGrade("PARTIAL")],
      flags({ case_note_flagged: true }),
    );
    expect(partial.verdict).toEqual({
      section: "CASE_NOTE",
      outcome: "NOT_BAD",
      correctedGrade: "PARTIAL",
    });
  });

  test("decodes Can't grade into Other only when notes are present", () => {
    const [withNotes] = decodeLlmajTriageAnnotation(
      [caseNoteGrade("OTHER"), caseNoteNotes("Transcript too garbled.")],
      flags({ case_note_flagged: true }),
    );
    expect(withNotes.verdict).toEqual({
      section: "CASE_NOTE",
      outcome: "OTHER",
      notes: "Transcript too garbled.",
    });

    // Can't grade requires notes; a blank one fails to decode into a verdict
    // Label Studio itself wouldn't have accepted, rather than producing one
    // with an empty explanation.
    const [withoutNotes] = decodeLlmajTriageAnnotation(
      [caseNoteGrade("OTHER")],
      flags({ case_note_flagged: true }),
    );
    expect(withoutNotes.grade).toBe("OTHER");
    expect(withoutNotes.verdict).toBeNull();
  });

  test("an unflagged section's grade is a plain signal, not a verdict", () => {
    const [, actionItems] = decodeLlmajTriageAnnotation(
      [actionItemsGrade("BAD")],
      flags(),
    );
    expect(actionItems.flagged).toBe(false);
    expect(actionItems.grade).toBe("BAD");
    expect(actionItems.verdict).toBeNull();
  });

  test("an ungraded section decodes to nulls throughout", () => {
    const [caseNote] = decodeLlmajTriageAnnotation([], flags());
    expect(caseNote).toEqual(sectionResult());
  });

  describe("Overall's appliesTo", () => {
    test("decodes the selected sections, dropping the Neither sentinel", () => {
      const [, , overall] = decodeLlmajTriageAnnotation(
        [
          overallGrade("BAD"),
          overallAppliesTo("CASE_NOTE"),
          overallAppliesTo("ACTION_ITEMS"),
        ],
        flags({ overall_flagged: true }),
      );
      expect(overall.appliesTo).toEqual(["CASE_NOTE", "ACTION_ITEMS"]);
      expect(overall.verdict).toMatchObject({
        appliesTo: ["CASE_NOTE", "ACTION_ITEMS"],
      });
    });

    test("a Neither-only answer decodes to an empty appliesTo", () => {
      const [, , overall] = decodeLlmajTriageAnnotation(
        [overallGrade("PARTIAL"), overallAppliesTo("NEITHER")],
        flags({ overall_flagged: true }),
      );
      expect(overall.appliesTo).toEqual([]);
      expect(overall.verdict).toEqual({
        section: "OVERALL",
        outcome: "NOT_BAD",
        correctedGrade: "PARTIAL",
        appliesTo: [],
      });
    });

    test("a GOOD grade with no answer decodes appliesTo as neither, since the control is hidden", () => {
      const [, , overall] = decodeLlmajTriageAnnotation(
        [overallGrade("GOOD")],
        flags({ overall_flagged: true }),
      );
      expect(overall.appliesTo).toEqual([]);
      expect(overall.verdict).toEqual({
        section: "OVERALL",
        outcome: "NOT_BAD",
        correctedGrade: "GOOD",
        appliesTo: [],
      });
    });

    test("an unanswered appliesTo on a BAD grade fails to decode a verdict", () => {
      // The template always shows the control for BAD/PARTIAL, so a missing
      // answer means a malformed export, not a rater who skipped it.
      const [, , overall] = decodeLlmajTriageAnnotation(
        [overallGrade("BAD")],
        flags({ overall_flagged: true }),
      );
      expect(overall.appliesTo).toBeNull();
      expect(overall.verdict).toBeNull();
    });

    test("CASE_NOTE and ACTION_ITEMS never have an appliesTo", () => {
      const [caseNote, actionItems] = decodeLlmajTriageAnnotation(
        [caseNoteGrade("BAD"), actionItemsGrade("GOOD")],
        flags({ case_note_flagged: true }),
      );
      expect(caseNote.appliesTo).toBeNull();
      expect(actionItems.appliesTo).toBeNull();
    });
  });
});

describe("isLlmajTriageGradedBad", () => {
  test("true only for a BAD grade", () => {
    const flagged = (grade: LlmajTriageSectionResult["grade"]) =>
      isLlmajTriageGradedBad(sectionResult({ flagged: true, grade }));
    expect(flagged("BAD")).toBe(true);
    expect(flagged("PARTIAL")).toBe(false);
    expect(flagged("OTHER")).toBe(false);
    expect(flagged(null)).toBe(false);
  });

  test("true for a BAD grade on a section the judge didn't flag", () => {
    expect(
      isLlmajTriageGradedBad(sectionResult({ flagged: false, grade: "BAD" })),
    ).toBe(true);
  });

  test("true for a flagged Overall BAD whose verdict failed to decode", () => {
    expect(
      isLlmajTriageGradedBad(
        sectionResult({
          section: "OVERALL",
          flagged: true,
          grade: "BAD",
          verdict: null,
        }),
      ),
    ).toBe(true);
  });
});

describe("isLlmajTriageTaskGradedBad", () => {
  test("true when any section is graded BAD", () => {
    expect(
      isLlmajTriageTaskGradedBad({
        ACTION_ITEMS: sectionResult({
          section: "ACTION_ITEMS",
          flagged: true,
          grade: "BAD",
        }),
      }),
    ).toBe(true);
  });

  test("true when the only BAD is on a section the judge didn't flag", () => {
    expect(
      isLlmajTriageTaskGradedBad({
        ACTION_ITEMS: sectionResult({ section: "ACTION_ITEMS", grade: "BAD" }),
      }),
    ).toBe(true);
  });

  test("false when nothing is BAD", () => {
    expect(
      isLlmajTriageTaskGradedBad({
        CASE_NOTE: sectionResult({ flagged: true, grade: "GOOD" }),
      }),
    ).toBe(false);
  });

  test("false for an empty collapsed map", () => {
    expect(isLlmajTriageTaskGradedBad({})).toBe(false);
  });
});

describe("collapseLlmajTriageGrades", () => {
  test("the worst grade across raters wins", () => {
    const collapsed = collapseLlmajTriageGrades(
      [
        {
          raterEmail: "alex@example.com",
          sections: [sectionResult({ grade: "PARTIAL" })],
        },
        {
          raterEmail: "sam@example.com",
          sections: [sectionResult({ grade: "BAD" })],
        },
      ],
      AUTHORITATIVE,
    );
    expect(collapsed.CASE_NOTE?.grade).toBe("BAD");
  });

  test("the authoritative rater overrides the worst grade outright", () => {
    const collapsed = collapseLlmajTriageGrades(
      [
        {
          raterEmail: "alex@example.com",
          sections: [sectionResult({ grade: "BAD" })],
        },
        {
          raterEmail: AUTHORITATIVE,
          sections: [sectionResult({ grade: "GOOD" })],
        },
      ],
      AUTHORITATIVE,
    );
    expect(collapsed.CASE_NOTE?.grade).toBe("GOOD");
  });

  test("Can't grade never outranks a real grade", () => {
    const collapsed = collapseLlmajTriageGrades(
      [
        {
          raterEmail: "alex@example.com",
          sections: [sectionResult({ grade: "OTHER" })],
        },
        {
          raterEmail: "sam@example.com",
          sections: [sectionResult({ grade: "GOOD" })],
        },
      ],
      AUTHORITATIVE,
    );
    expect(collapsed.CASE_NOTE?.grade).toBe("GOOD");
  });

  test("a section nobody graded is left out of the collapsed map", () => {
    const collapsed = collapseLlmajTriageGrades(
      [
        {
          raterEmail: "alex@example.com",
          sections: [sectionResult({ grade: null })],
        },
      ],
      AUTHORITATIVE,
    );
    expect(collapsed.CASE_NOTE).toBeUndefined();
  });
});
