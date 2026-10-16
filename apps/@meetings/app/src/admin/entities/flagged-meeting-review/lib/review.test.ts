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

import type {
  ReviewOutcomeSummary,
  SectionReview,
  SectionReviews,
} from "~@meetings/app/admin/api/flaggedMeetings";

import {
  isNeedsReview,
  meetingReviewState,
  outcomeLabel,
  promptFollowUpLabel,
  reopenSentence,
  reviewableSections,
  staffEmailStatus,
} from "./review";

const outcome = (
  overrides: Partial<ReviewOutcomeSummary> = {},
): ReviewOutcomeSummary => ({
  id: "outcome-1",
  outcome: "CONFIRMED_BAD",
  followUp: "NO_ACTION",
  correctedGrade: null,
  overriddenSources: [],
  appliesTo: [],
  notetakingPromptFollowUp: false,
  judgePromptFollowUp: false,
  staffEmailSentAt: null,
  staffEmailSentBy: null,
  notes: null,
  reviewerEmail: "admin@example.com",
  createdAt: new Date("2026-09-10T12:00:00Z"),
  ...overrides,
});

const none: SectionReview = {
  status: "not_flagged",
  latestOutcome: null,
  reopened: null,
};
const needs: SectionReview = { ...none, status: "needs_review" };
const reviewed = (o = outcome()): SectionReview => ({
  status: "reviewed",
  latestOutcome: o,
  reopened: null,
});

const reviews = (overrides: Partial<SectionReviews>): SectionReviews => ({
  CASE_NOTE: none,
  ACTION_ITEMS: none,
  OVERALL: none,
  ...overrides,
});

describe("outcomeLabel", () => {
  it("summarizes a confirmed BAD with its follow-up", () => {
    expect(
      outcomeLabel(outcome({ followUp: "EMAIL_STAFF" }), "CASE_NOTE"),
    ).toBe("Confirmed BAD · Staff email pending");
  });

  it("summarizes a Not BAD with its corrected grade and overrides", () => {
    expect(
      outcomeLabel(
        outcome({
          outcome: "NOT_BAD",
          correctedGrade: "PARTIAL",
          overriddenSources: ["LLM_JUDGE", "LABEL_STUDIO"],
          followUp: "EMAIL_STAFF",
        }),
        "CASE_NOTE",
      ),
    ).toBe("Not BAD → Partial · overrides LLMAJ + LS · Staff email pending");
  });

  it("names the sections an Overall outcome covers, or neither", () => {
    expect(
      outcomeLabel(
        outcome({ appliesTo: ["CASE_NOTE", "ACTION_ITEMS"] }),
        "OVERALL",
      ),
    ).toBe("Confirmed BAD · case note + action items · no action");
    expect(outcomeLabel(outcome({ appliesTo: [] }), "OVERALL")).toBe(
      "Confirmed BAD · neither section · no action",
    );
  });

  it("names the prompts flagged for an update", () => {
    expect(promptFollowUpLabel(outcome())).toBeNull();
    expect(
      promptFollowUpLabel(
        outcome({ notetakingPromptFollowUp: true, judgePromptFollowUp: true }),
      ),
    ).toBe("Prompt follow-up: notetaking + LLM judge");
  });

  it("says whether staff have been emailed yet", () => {
    expect(staffEmailStatus(outcome())).toBeNull();
    expect(staffEmailStatus(outcome({ followUp: "EMAIL_STAFF" }))).toEqual({
      label: "Staff email pending",
      detail: null,
      tone: "partial",
    });
    expect(
      staffEmailStatus(
        outcome({
          followUp: "EMAIL_STAFF",
          staffEmailSentAt: new Date("2026-09-12T12:00:00Z"),
          staffEmailSentBy: "admin@example.com",
        }),
      ),
    ).toEqual({
      label: "Staff emailed",
      detail: "by admin@example.com · Sep 12",
      tone: "good",
    });
  });

  it("labels Other plainly", () => {
    expect(outcomeLabel(outcome({ outcome: "OTHER" }), "OVERALL")).toBe(
      "Other / bug",
    );
  });
});

describe("meetingReviewState", () => {
  it("needs review when no flagged section has an outcome", () => {
    expect(meetingReviewState(reviews({ CASE_NOTE: needs }))).toEqual({
      reviewed: false,
      label: "Needs review",
      tone: "partial",
    });
  });

  it("counts finished sections while some remain", () => {
    expect(
      meetingReviewState(
        reviews({ CASE_NOTE: reviewed(), ACTION_ITEMS: needs }),
      ).label,
    ).toBe("1 of 2 reviewed");
  });

  it("shows the outcome once its only section is reviewed", () => {
    expect(meetingReviewState(reviews({ CASE_NOTE: reviewed() }))).toEqual({
      reviewed: true,
      label: "Confirmed BAD · no action",
      tone: "bad",
    });
  });

  it("counts outcomes when several sections are reviewed", () => {
    expect(
      meetingReviewState(
        reviews({ CASE_NOTE: reviewed(), ACTION_ITEMS: reviewed() }),
      ).label,
    ).toBe("2 outcomes");
  });

  it("is reopened, and needs review, when a section reopened", () => {
    const state = reviews({
      CASE_NOTE: reviewed(),
      ACTION_ITEMS: {
        status: "reopened",
        latestOutcome: outcome(),
        reopened: { reason: "thumbs_down", at: new Date(), by: "a@b.org" },
      },
    });

    expect(meetingReviewState(state)).toMatchObject({
      reviewed: false,
      label: "Reopened · new thumbs down",
      tone: "bad",
    });
    expect(isNeedsReview(state)).toBe(true);
  });

  it("keeps a section whose flags cleared in the review", () => {
    const state = reviews({ CASE_NOTE: reviewed() });

    expect(reviewableSections(state)).toEqual(["CASE_NOTE"]);
  });
});

describe("reopenSentence", () => {
  const at = new Date("2026-09-12T12:00:00Z");

  it("names who acted and what they did", () => {
    expect(
      reopenSentence("CASE_NOTE", {
        reason: "label_studio",
        at,
        by: "rater@example.com",
      }),
    ).toBe("rater@example.com rated the case note Bad on Sep 12");
    expect(
      reopenSentence("ACTION_ITEMS", {
        reason: "thumbs_down",
        at,
        by: "staff@example.com",
      }),
    ).toBe("staff@example.com gave the action items a thumbs down on Sep 12");
  });

  it("describes events with no actor or time", () => {
    expect(
      reopenSentence("CASE_NOTE", {
        reason: "outputs_regenerated",
        at: null,
        by: null,
      }),
    ).toBe("The meeting's notes were regenerated");
    expect(
      reopenSentence("OVERALL", { reason: "evaluation", at, by: null }),
    ).toBe("The LLM judge rated the overall Bad on Sep 12");
  });
});
