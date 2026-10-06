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
  OutputVoteTab,
  OutputVoteValue,
  ReviewOutcomeKind,
  StateCode,
} from "~@meetings/prisma/client";
import {
  isFlaggedByLabelStudio,
  LS_AUTHORITATIVE_RATER_EMAIL,
} from "~@meetings/tasks/admin/label-studio-grades";
import type { LlmajDimension } from "~@meetings/tasks/admin/llmaj-grades";
import {
  combineRaterGrades,
  computeSectionFlags,
  computeSectionReviews,
  isAnySectionFlagged,
  resolveRequestedStates,
  type ReviewOutcomeRow,
} from "~@meetings/trpc/routes/admin/flagged-meetings/utils";

function dimension(key: LlmajDimension["key"], bad: boolean): LlmajDimension {
  return {
    key,
    label: key,
    gradeOrWinner: bad ? "BAD" : "GOOD",
    rationale: "",
    hallucinations: [],
    omissions: [],
    bad,
  };
}

describe("resolveRequestedStates", () => {
  test("defaults to the caller's allowed states", () => {
    expect(
      resolveRequestedStates({
        allowedStates: [StateCode.US_NE, StateCode.US_ND],
      }),
    ).toEqual([StateCode.US_NE, StateCode.US_ND]);
  });

  test("excludes US_DEMO from the default set", () => {
    // Recidiviz's own test data — never useful in a ratings triage view, but
    // still reachable by naming it explicitly.
    expect(
      resolveRequestedStates({
        allowedStates: [StateCode.US_NE, StateCode.US_DEMO],
      }),
    ).toEqual([StateCode.US_NE]);
    expect(
      resolveRequestedStates(
        { allowedStates: [StateCode.US_NE, StateCode.US_DEMO] },
        [StateCode.US_DEMO],
      ),
    ).toEqual([StateCode.US_DEMO]);
  });

  test("drops allowed states that @meetings does not support", () => {
    expect(
      resolveRequestedStates({ allowedStates: [StateCode.US_NE, "US_XX"] }),
    ).toEqual([StateCode.US_NE]);
  });

  test("returns nothing for a caller with no allowed states", () => {
    expect(resolveRequestedStates({ allowedStates: [] })).toEqual([]);
    expect(resolveRequestedStates({})).toEqual([]);
  });

  test("narrows to the requested subset", () => {
    expect(
      resolveRequestedStates(
        { allowedStates: [StateCode.US_NE, StateCode.US_ND] },
        [StateCode.US_ND],
      ),
    ).toEqual([StateCode.US_ND]);
  });

  test("throws rather than silently dropping a state the caller can't see", () => {
    // Returning fewer rows would hide a permissions problem behind what looks
    // like an empty result.
    expect(() =>
      resolveRequestedStates({ allowedStates: [StateCode.US_NE] }, [
        StateCode.US_NE,
        StateCode.US_ND,
      ]),
    ).toThrow(/US_ND/);
  });
});

describe("computeSectionFlags", () => {
  const none = { llm: false, labelStudio: false, vote: false };

  test("case note and action items map straight from each source", () => {
    const flags = computeSectionFlags({
      llmDimensions: [
        dimension("caseNote", true),
        dimension("actionItems", false),
      ],
      labelStudio: {
        collapsed: { actionItems: "BAD" },
        hasUncoveredBadGrade: false,
      },
      votes: [
        { tab: OutputVoteTab.DRAFT_CASE_NOTES, vote: OutputVoteValue.DOWN },
      ],
    });

    expect(flags.CASE_NOTE).toEqual({
      llm: true,
      labelStudio: false,
      vote: true,
    });
    expect(flags.ACTION_ITEMS).toEqual({
      llm: false,
      labelStudio: true,
      vote: false,
    });
    expect(flags.OVERALL).toEqual(none);
  });

  test("a BAD overall alone flags Overall", () => {
    const flags = computeSectionFlags({
      llmDimensions: [
        dimension("caseNote", false),
        dimension("actionItems", false),
        dimension("overall", true),
      ],
      labelStudio: {
        collapsed: { overall: "BAD" },
        hasUncoveredBadGrade: false,
      },
      votes: [],
    });

    expect(flags.OVERALL).toEqual({
      llm: true,
      labelStudio: true,
      vote: false,
    });
  });

  test("a BAD overall on top of a BAD case note or action items does not flag Overall", () => {
    const flags = computeSectionFlags({
      llmDimensions: [
        dimension("actionItems", true),
        dimension("overall", true),
      ],
      labelStudio: {
        collapsed: { caseNote: "BAD", overall: "BAD" },
        hasUncoveredBadGrade: false,
      },
      votes: [],
    });

    expect(flags.OVERALL).toEqual(none);
    expect(flags.ACTION_ITEMS.llm).toBe(true);
    expect(flags.CASE_NOTE.labelStudio).toBe(true);
  });

  test("a BAD Label Studio field outside the three dimensions flags Overall", () => {
    const flags = computeSectionFlags({
      llmDimensions: undefined,
      labelStudio: { collapsed: {}, hasUncoveredBadGrade: true },
      votes: [],
    });

    expect(flags.OVERALL.labelStudio).toBe(true);
  });

  test("that outside BAD does not flag Overall when a section is already BAD", () => {
    const flags = computeSectionFlags({
      llmDimensions: undefined,
      labelStudio: {
        collapsed: { caseNote: "BAD" },
        hasUncoveredBadGrade: true,
      },
      votes: [],
    });

    expect(flags.OVERALL.labelStudio).toBe(false);
    expect(flags.CASE_NOTE.labelStudio).toBe(true);
  });

  test("thumbs-downs land on the section their tab is about, and Staff Feedback flags nothing", () => {
    const flags = computeSectionFlags({
      llmDimensions: undefined,
      labelStudio: undefined,
      votes: [
        { tab: OutputVoteTab.ACTION_ITEMS, vote: OutputVoteValue.DOWN },
        { tab: OutputVoteTab.STAFF_FEEDBACK, vote: OutputVoteValue.DOWN },
        { tab: OutputVoteTab.DRAFT_CASE_NOTES, vote: OutputVoteValue.UP },
      ],
    });

    expect(flags.ACTION_ITEMS.vote).toBe(true);
    expect(flags.OVERALL.vote).toBe(false);
    expect(flags.CASE_NOTE.vote).toBe(false);
  });

  test("a BAD transcript comparison never flags anything", () => {
    const flags = computeSectionFlags({
      llmDimensions: [dimension("transcriptComparison", true)],
      labelStudio: undefined,
      votes: [],
    });

    expect(isAnySectionFlagged(flags)).toBe(false);
  });

  test("agrees with the Label Studio flagging rule", () => {
    const cases = [
      { collapsed: {}, uncovered: false },
      { collapsed: { overall: "BAD" as const }, uncovered: false },
      { collapsed: { caseNote: "BAD" as const }, uncovered: false },
      { collapsed: { actionItems: "BAD" as const }, uncovered: false },
      { collapsed: { caseNote: "PARTIAL" as const }, uncovered: true },
      {
        collapsed: { caseNote: "BAD" as const, overall: "BAD" as const },
        uncovered: true,
      },
    ];
    for (const { collapsed, uncovered } of cases) {
      const flags = computeSectionFlags({
        llmDimensions: undefined,
        labelStudio: { collapsed, hasUncoveredBadGrade: uncovered },
        votes: [],
      });
      expect(isAnySectionFlagged(flags)).toBe(
        isFlaggedByLabelStudio(collapsed, uncovered),
      );
    }
  });
});

describe("combineRaterGrades", () => {
  test("the worst grade wins when nobody is authoritative", () => {
    const raters = [
      { raterEmail: "a@example.com", grades: { caseNote: "GOOD" as const } },
      { raterEmail: "b@example.com", grades: { caseNote: "BAD" as const } },
    ];

    expect(combineRaterGrades(raters, { caseNote: "BAD" }).caseNote).toEqual({
      grade: "BAD",
      worst: "BAD",
      overriddenByAuthoritative: false,
    });
  });

  test("flags a dimension the authoritative rater overrode", () => {
    const raters = [
      { raterEmail: "a@example.com", grades: { caseNote: "BAD" as const } },
      {
        raterEmail: LS_AUTHORITATIVE_RATER_EMAIL,
        grades: { caseNote: "PARTIAL" as const },
      },
    ];

    expect(
      combineRaterGrades(raters, { caseNote: "PARTIAL" }).caseNote,
    ).toEqual({
      grade: "PARTIAL",
      worst: "BAD",
      overriddenByAuthoritative: true,
    });
  });

  test("reports nothing for a dimension nobody graded", () => {
    expect(combineRaterGrades([], {}).overall).toEqual({
      grade: null,
      worst: null,
      overriddenByAuthoritative: false,
    });
  });
});

describe("computeSectionReviews", () => {
  const OUTCOME_AT = new Date("2026-09-10T00:00:00Z");
  const BEFORE = new Date("2026-09-05T00:00:00Z");
  const AFTER = new Date("2026-09-12T00:00:00Z");

  const noFlags = computeSectionFlags({
    llmDimensions: undefined,
    labelStudio: undefined,
    votes: [],
  });
  const caseNoteFlagged = {
    ...noFlags,
    CASE_NOTE: { llm: true, labelStudio: false, vote: false },
  };

  function outcome(
    overrides: Partial<ReviewOutcomeRow> = {},
  ): ReviewOutcomeRow {
    return {
      meetingId: "m1",
      section: "CASE_NOTE",
      pipelineRunId: "run-1",
      outcome: ReviewOutcomeKind.CONFIRMED_BAD,
      followUp: "NO_ACTION",
      correctedGrade: null,
      overriddenSources: [],
      appliesTo: [],
      notes: null,
      reviewerEmail: "admin@recidiviz.org",
      createdAt: OUTCOME_AT,
      ...overrides,
    };
  }

  function review(
    overrides: Partial<Parameters<typeof computeSectionReviews>[0]> = {},
  ) {
    return computeSectionReviews({
      flags: caseNoteFlagged,
      outcomes: { CASE_NOTE: outcome() },
      outputsPipelineRunId: "run-1",
      labelStudio: undefined,
      votes: [],
      badEvaluations: [],
      ...overrides,
    }).CASE_NOTE;
  }

  function lsAnnotation(at: Date, grade: "BAD" | "GOOD") {
    return {
      annotations: [
        {
          raterEmail: "rater@recidiviz.org",
          annotatedAt: at,
          updatedAt: at,
          decodedFields: [],
          grades: { caseNote: grade },
          actionItemsIgnoredFieldName: null,
        },
      ],
    };
  }

  test("a flagged section with no outcome needs review", () => {
    expect(review({ outcomes: {} })).toEqual({
      status: "needs_review",
      latestOutcome: null,
      reopened: null,
    });
  });

  test("an unflagged section with no outcome is not flagged", () => {
    expect(review({ flags: noFlags, outcomes: {} }).status).toBe("not_flagged");
  });

  test("a flagged section with an outcome and nothing newer is reviewed", () => {
    expect(review()).toMatchObject({ status: "reviewed", reopened: null });
  });

  test("a section stays reviewed once its flags clear", () => {
    expect(review({ flags: noFlags }).status).toBe("reviewed");
  });

  test("a new BAD Label Studio annotation reopens it", () => {
    expect(review({ labelStudio: lsAnnotation(AFTER, "BAD") })).toMatchObject({
      status: "reopened",
      reopened: {
        reason: "label_studio",
        at: AFTER,
        by: "rater@recidiviz.org",
      },
    });
  });

  test("a Label Studio BAD from before the outcome does not", () => {
    expect(review({ labelStudio: lsAnnotation(BEFORE, "BAD") }).status).toBe(
      "reviewed",
    );
  });

  test("a newer non-BAD Label Studio annotation does not", () => {
    expect(review({ labelStudio: lsAnnotation(AFTER, "GOOD") }).status).toBe(
      "reviewed",
    );
  });

  test("a newer thumbs-down on the section's tab reopens it", () => {
    expect(
      review({
        votes: [
          {
            tab: OutputVoteTab.DRAFT_CASE_NOTES,
            vote: OutputVoteValue.DOWN,
            createdAt: AFTER,
            voterEmail: "staff@example.com",
          },
        ],
      }),
    ).toMatchObject({
      status: "reopened",
      reopened: { reason: "thumbs_down", by: "staff@example.com" },
    });
  });

  test("a thumbs-down on another tab, or a thumbs-up, does not", () => {
    expect(
      review({
        votes: [
          {
            tab: OutputVoteTab.ACTION_ITEMS,
            vote: OutputVoteValue.DOWN,
            createdAt: AFTER,
            voterEmail: "staff@example.com",
          },
          {
            tab: OutputVoteTab.DRAFT_CASE_NOTES,
            vote: OutputVoteValue.UP,
            createdAt: AFTER,
            voterEmail: "staff@example.com",
          },
        ],
      }).status,
    ).toBe("reviewed");
  });

  test("a newer BAD evaluation reopens it", () => {
    expect(
      review({ badEvaluations: [{ section: "CASE_NOTE", createdAt: AFTER }] }),
    ).toMatchObject({ status: "reopened", reopened: { reason: "evaluation" } });
  });

  test("a BAD evaluation of another section does not", () => {
    expect(
      review({ badEvaluations: [{ section: "OVERALL", createdAt: AFTER }] })
        .status,
    ).toBe("reviewed");
  });

  test("regenerated outputs reopen a section that is still flagged", () => {
    expect(review({ outputsPipelineRunId: "run-2" })).toMatchObject({
      status: "reopened",
      reopened: { reason: "outputs_regenerated", at: null, by: null },
    });
  });

  test("regenerated outputs do not reopen a section that is no longer flagged", () => {
    expect(
      review({ flags: noFlags, outputsPipelineRunId: "run-2" }).status,
    ).toBe("reviewed");
  });

  test("reports the latest event as the reason", () => {
    const later = new Date("2026-09-20T00:00:00Z");
    expect(
      review({
        labelStudio: lsAnnotation(AFTER, "BAD"),
        badEvaluations: [{ section: "CASE_NOTE", createdAt: later }],
        outputsPipelineRunId: "run-2",
      }).reopened,
    ).toEqual({ reason: "evaluation", at: later, by: null });
  });
});
