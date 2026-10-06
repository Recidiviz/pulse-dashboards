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
  isAnySectionFlagged,
  resolveRequestedStates,
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
