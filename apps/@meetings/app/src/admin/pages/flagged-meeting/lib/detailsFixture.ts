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

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";

type Rater = NonNullable<
  FlaggedMeetingDetails["labelStudio"]
>["raters"][number];

const NO_FLAG = { llm: false, labelStudio: false, vote: false };

type Reviews = FlaggedMeetingDetails["reviews"];

const NOT_FLAGGED: Reviews["CASE_NOTE"] = {
  status: "not_flagged",
  latestOutcome: null,
  reopened: null,
};

/** Reviews with nothing recorded: the case note needs review and the rest are not flagged. */
export function makeReviews(overrides: Partial<Reviews> = {}): Reviews {
  return {
    CASE_NOTE: { ...NOT_FLAGGED, status: "needs_review" },
    ACTION_ITEMS: NOT_FLAGGED,
    OVERALL: NOT_FLAGGED,
    ...overrides,
  };
}

export function makeDetails(
  overrides: Partial<FlaggedMeetingDetails> = {},
): FlaggedMeetingDetails {
  return {
    meetingId: "meeting-123",
    stateCode: "US_NE",
    staffEmail: "officer@example.com",
    person: { type: "client", name: "Pat Doe", displayId: "1234" },
    meetingType: "Office visit",
    startTime: new Date("2026-09-01T15:00:00Z"),
    durationMs: 25 * 60_000,
    audioDeletedAt: null,
    transcriptDeletedAt: null,
    audioConsoleUrl: "https://console.example/audio",
    llm: {
      evaluatorVersion: "3",
      createdAt: new Date("2026-09-02T12:00:00Z"),
      dimensions: [
        {
          key: "caseNote",
          label: "Case Note",
          gradeOrWinner: "BAD",
          rationale: "Invented a court date.",
          hallucinations: ["Court date on Friday"],
          omissions: [],
          bad: true,
        },
        {
          key: "transcriptComparison",
          label: "Transcript",
          gradeOrWinner: "DEEPGRAM",
          rationale: "Deepgram caught more words.",
          hallucinations: [],
          omissions: [],
          providerGrades: { assemblyai: "PARTIAL", deepgram: "GOOD" },
          bad: false,
        },
      ],
    },
    labelStudio: null,
    votes: [],
    sections: {
      CASE_NOTE: { llm: true, labelStudio: false, vote: false },
      ACTION_ITEMS: NO_FLAG,
      OVERALL: NO_FLAG,
    },
    reviews: makeReviews(),
    outputsPipelineRunId: "run-1",
    caseNote: {
      current: "Final case note text.",
      original: null,
      editedAt: null,
      approvedAt: new Date("2026-09-01T18:00:00Z"),
    },
    actionItems: {
      items: [],
      legacyItems: [],
      editedAt: null,
      approvedAt: null,
    },
    userNotepadNotes: null,
    transcript: [
      { speaker: "Officer", text: "Hello there.", startTimeMs: 65_000 },
    ],
    ...overrides,
  };
}

export function makeRater(overrides: Partial<Rater> = {}): Rater {
  return {
    raterEmail: "alex@example.com",
    annotatedAt: new Date("2026-09-03T12:00:00Z"),
    updatedAt: new Date("2026-09-03T12:00:00Z"),
    isAuthoritative: false,
    grades: { overall: "BAD", caseNote: "BAD", actionItems: "GOOD" },
    transcriptGrade: "PARTIAL",
    fields: [],
    actionItemsIgnoredFieldName: null,
    ...overrides,
  };
}

export function withRaters(
  raters: Rater[],
  combined?: NonNullable<FlaggedMeetingDetails["labelStudio"]>["combined"],
): NonNullable<FlaggedMeetingDetails["labelStudio"]> {
  return {
    taskId: 77,
    taskUrl: "https://ls.example/task/77",
    raters,
    combined: combined ?? {
      overall: { grade: "BAD", worst: "BAD", overriddenByAuthoritative: false },
      caseNote: {
        grade: "BAD",
        worst: "BAD",
        overriddenByAuthoritative: false,
      },
      actionItems: {
        grade: "GOOD",
        worst: "GOOD",
        overriddenByAuthoritative: false,
      },
    },
  };
}
