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
  canSave,
  draftFromOutcome,
  emptyDraft,
  overridableSources,
  type ReviewDraft,
  toRecordInput,
} from "./reviewDraft";

const target = {
  stateCode: "US_NE" as const,
  meetingId: "m-1",
};

const draft = (overrides: Partial<ReviewDraft>): ReviewDraft => ({
  ...emptyDraft(["LLM_JUDGE", "LABEL_STUDIO"]),
  ...overrides,
});

describe("overridableSources", () => {
  const noFlag = { llm: false, labelStudio: false, vote: false };
  const sections = {
    CASE_NOTE: { ...noFlag, llm: true },
    ACTION_ITEMS: noFlag,
    OVERALL: noFlag,
  };
  const combined = (grade: "PARTIAL" | "GOOD" | null) => ({
    grade,
    worst: grade,
    overriddenByAuthoritative: false,
  });
  const labelStudio = (caseNote: "PARTIAL" | "GOOD" | null) => ({
    taskId: 1,
    taskUrl: "https://ls.example/task/1",
    raters: [],
    combined: {
      caseNote: combined(caseNote),
      actionItems: combined(null),
      overall: combined(null),
    },
  });
  const llm = (key: "caseNote" | "overall") => ({
    evaluatorVersion: "1",
    createdAt: new Date(),
    dimensions: [
      {
        key,
        label: key,
        gradeOrWinner: "BAD",
        rationale: "",
        hallucinations: [],
        omissions: [],
        bad: true,
      },
    ],
  });

  it("offers a rating that did not flag the section, such as a Label Studio Partial", () => {
    expect(
      overridableSources(
        { llm: llm("caseNote"), labelStudio: labelStudio("PARTIAL"), sections },
        "CASE_NOTE",
      ),
    ).toEqual({ rated: ["LLM_JUDGE", "LABEL_STUDIO"], flagged: ["LLM_JUDGE"] });
  });

  it("leaves out a source that gave no rating on the section", () => {
    expect(
      overridableSources(
        { llm: llm("overall"), labelStudio: labelStudio(null), sections },
        "CASE_NOTE",
      ),
    ).toEqual({ rated: ["LLM_JUDGE"], flagged: ["LLM_JUDGE"] });
    expect(
      overridableSources(
        { llm: null, labelStudio: null, sections },
        "ACTION_ITEMS",
      ),
    ).toEqual({ rated: [], flagged: [] });
  });
});

describe("canSave", () => {
  it("needs an outcome", () => {
    expect(canSave("CASE_NOTE", draft({}))).toBe(false);
    expect(canSave("CASE_NOTE", draft({ outcome: "CONFIRMED_BAD" }))).toBe(
      true,
    );
  });

  it("needs an answer to which sections an Overall outcome covers", () => {
    expect(canSave("OVERALL", draft({ outcome: "NOT_BAD" }))).toBe(false);
    expect(
      canSave("OVERALL", draft({ outcome: "NOT_BAD", appliesTo: [] })),
    ).toBe(true);
  });

  it("needs notes for Other", () => {
    expect(canSave("CASE_NOTE", draft({ outcome: "OTHER" }))).toBe(false);
    expect(
      canSave("CASE_NOTE", draft({ outcome: "OTHER", notes: "  OBT-1 " })),
    ).toBe(true);
  });
});

describe("toRecordInput", () => {
  const build = (section: "CASE_NOTE" | "OVERALL", d: ReviewDraft) =>
    toRecordInput({ ...target, section, draft: d });

  it("builds a confirmed BAD with its follow-up", () => {
    expect(
      build(
        "CASE_NOTE",
        draft({ outcome: "CONFIRMED_BAD", followUp: "USER_CAUGHT_IT" }),
      ),
    ).toEqual({
      ...target,
      notetakingPromptFollowUp: false,
      judgePromptFollowUp: false,
      section: "CASE_NOTE",
      outcome: "CONFIRMED_BAD",
      followUp: "USER_CAUGHT_IT",
    });
  });

  it("builds a Not BAD with its overrides, and drops 'user caught it'", () => {
    expect(
      build(
        "CASE_NOTE",
        draft({
          outcome: "NOT_BAD",
          correctedGrade: "PARTIAL",
          overriddenSources: ["LABEL_STUDIO"],
          followUp: "USER_CAUGHT_IT",
          notes: " judge was wrong ",
        }),
      ),
    ).toEqual({
      ...target,
      notetakingPromptFollowUp: false,
      judgePromptFollowUp: false,
      section: "CASE_NOTE",
      outcome: "NOT_BAD",
      correctedGrade: "PARTIAL",
      overriddenSources: ["LABEL_STUDIO"],
      followUp: "NO_ACTION",
      notes: "judge was wrong",
    });
  });

  it("sends appliesTo only for an Overall outcome", () => {
    expect(
      build(
        "OVERALL",
        draft({ outcome: "CONFIRMED_BAD", appliesTo: ["CASE_NOTE"] }),
      ),
    ).toMatchObject({ appliesTo: ["CASE_NOTE"] });
    expect(
      build(
        "CASE_NOTE",
        draft({ outcome: "CONFIRMED_BAD", appliesTo: ["CASE_NOTE"] }),
      ),
    ).not.toHaveProperty("appliesTo");
  });

  it("leaves out the corrected grade and overrides when there is no grade", () => {
    const input = build(
      "CASE_NOTE",
      draft({ outcome: "NOT_BAD", correctedGrade: null }),
    );
    expect(input).toMatchObject({ overriddenSources: [] });
    expect(input).not.toHaveProperty("correctedGrade");
  });

  it("returns null for a draft that is not ready", () => {
    expect(build("CASE_NOTE", draft({}))).toBeNull();
  });
});

describe("draftFromOutcome", () => {
  it("restores a recorded outcome for editing", () => {
    expect(
      draftFromOutcome({
        id: "outcome-1",
        outcome: "NOT_BAD",
        followUp: "EMAIL_STAFF",
        correctedGrade: "PARTIAL",
        overriddenSources: ["LLM_JUDGE"],
        appliesTo: [],
        notetakingPromptFollowUp: false,
        judgePromptFollowUp: true,
        staffEmailSentAt: null,
        staffEmailSentBy: null,
        notes: "why",
        reviewerEmail: "a@b.org",
        createdAt: new Date(),
      }),
    ).toEqual({
      outcome: "NOT_BAD",
      followUp: "EMAIL_STAFF",
      correctedGrade: "PARTIAL",
      overriddenSources: ["LLM_JUDGE"],
      appliesTo: [],
      notetakingPromptFollowUp: false,
      judgePromptFollowUp: true,
      notes: "why",
    });
  });
});
