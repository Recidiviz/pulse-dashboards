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
  buildLabelStudioTask,
  LabelStudioMeeting,
} from "~@meetings/tasks/label-studio";

function makeTranscription(
  provider: string,
  confidence: number,
  utterances: { speaker: string; text: string }[],
) {
  return {
    provider,
    confidence,
    utterances,
  } as LabelStudioMeeting["transcriptions"][number];
}

function makeActionItem(
  overrides: Partial<LabelStudioMeeting["meetingActionItems"][number]> = {},
): LabelStudioMeeting["meetingActionItems"][number] {
  return {
    assignee: "Staff Member",
    generatedTask: "Follow up on housing",
    editedTask: null,
    context: null,
    evidenceQuotes: [],
    completed: false,
    deleted: false,
    pipelineRunId: "run-1",
    ...overrides,
  } as LabelStudioMeeting["meetingActionItems"][number];
}

function makeMeeting(
  overrides: Partial<LabelStudioMeeting> = {},
): LabelStudioMeeting {
  return {
    id: "meeting-1",
    durationMs: 1800000, // 30 minutes
    startTime: new Date("2026-03-15T10:00:00Z"),
    endTime: new Date("2026-03-15T10:30:00Z"),
    recordingsGCSBucket: "test-bucket",
    recordingsFolderPath: "meetings/meeting-1",
    finalRecordingGCSPath: "meetings/meeting-1/final.m4a",
    postMeetingProcessingStatus: "COMPLETED",
    caseNote: "Client discussed progress on goals.",
    actionItems: ["Follow up on housing", "Schedule next meeting"],
    structuredActionItems: [
      {
        task: "Follow up on housing",
        assignee: "Staff Member",
        deadline: "2026-04-01",
      },
      { task: "Schedule next meeting", assignee: "Client", deadline: null },
    ],
    notetakingPipelineRunId: "run-1",
    meetingActionItems: [
      makeActionItem(),
      makeActionItem({
        assignee: "Client",
        generatedTask: "Schedule next meeting",
      }),
    ],
    client: { displayPersonExternalId: "DISPLAY-001" },
    resident: null,
    transcriptions: [
      makeTranscription("ASSEMBLYAI", 0.95, [
        { speaker: "A", text: "Hello, how are you?" },
        { speaker: "B", text: "I am doing well." },
      ]),
      makeTranscription("DEEPGRAM", 0.88, [
        { speaker: "0", text: "Hello, how are you?" },
      ]),
    ],
    ...overrides,
  } as LabelStudioMeeting;
}

describe("buildLabelStudioTask", () => {
  test("builds task with all fields from a meeting with both providers", () => {
    const task = buildLabelStudioTask(makeMeeting(), "US_NE");

    expect(task.random_split).toBeGreaterThanOrEqual(0);
    expect(task.random_split).toBeLessThan(1);
    expect(task).toEqual(
      expect.objectContaining({
        audio: "gs://test-bucket/meetings/meeting-1/final.m4a",
        transcript_assemblyai:
          "[A]: Hello, how are you?\n[B]: I am doing well.",
        transcript_deepgram: "[0]: Hello, how are you?",
        transcript_best_provider: "assemblyai",
        transcript_best_confidence: 0.95,
        case_note: "Client discussed progress on goals.",
        action_items:
          "[Staff Member] Follow up on housing\n[Client] Schedule next meeting",
        needs_recidiviz_review: false,
        meta: {
          State: "US_NE",
          "Recording date": "2026-03-15",
          Duration: "30m 0s",
          "Meeting ID": "meeting-1",
          "Person Display ID": "DISPLAY-001",
          "Processing status": "COMPLETED",
        },
      }),
    );
  });

  test("rounds duration down to whole seconds when durationMs has a fractional second", () => {
    const task = buildLabelStudioTask(
      makeMeeting({ durationMs: 95500 }), // 1m 35.5s
      "US_NE",
    );

    expect(task.meta.Duration).toBe("1m 35s");
  });

  test("selects deepgram as best provider when it has highest confidence", () => {
    const task = buildLabelStudioTask(
      makeMeeting({
        transcriptions: [
          makeTranscription("DEEPGRAM", 0.99, [
            { speaker: "0", text: "Hello" },
          ]),
        ],
      }),
      "US_NE",
    );

    expect(task.transcript_best_provider).toBe("deepgram");
    expect(task.transcript_best_confidence).toBe(0.99);
    expect(task.transcript_assemblyai).toBeNull();
  });

  test("handles null finalRecordingGCSPath, endTime, and LLM outputs", () => {
    const task = buildLabelStudioTask(
      makeMeeting({
        finalRecordingGCSPath: null,
        caseNote: null,
        structuredActionItems: null,
        durationMs: null,
        meetingActionItems: [],
      }),
      "US_NE",
    );

    expect(task.audio).toBeNull();
    expect(task.meta.Duration).toBeNull();
    expect(task.case_note).toBeNull();
    expect(task.action_items).toBeNull();
  });

  test("uses resident displayPersonExternalId when client is null", () => {
    const task = buildLabelStudioTask(
      makeMeeting({
        client: null,
        resident: { displayPersonExternalId: "RESIDENT-001" },
      } as Partial<LabelStudioMeeting>),
      "US_NE",
    );

    expect(task.meta["Person Display ID"]).toBe("RESIDENT-001");
  });

  test("sets needs_recidiviz_review to true when passed", () => {
    const task = buildLabelStudioTask(makeMeeting(), "US_NE", true);
    expect(task.needs_recidiviz_review).toBe(true);
  });
});

describe("action_items", () => {
  function actionItemsFor(overrides: Partial<LabelStudioMeeting>) {
    return buildLabelStudioTask(makeMeeting(overrides), "US_NE").action_items;
  }

  test("shows the generated task, not a staff member's edit of it", () => {
    expect(
      actionItemsFor({
        meetingActionItems: [
          makeActionItem({ editedTask: "Follow up on housing by Friday" }),
        ],
      }),
    ).toBe("[Staff Member] Follow up on housing");
  });

  test("keeps items staff deleted or completed — all were generated output", () => {
    expect(
      actionItemsFor({
        meetingActionItems: [
          makeActionItem({ deleted: true }),
          makeActionItem({
            generatedTask: "Schedule next meeting",
            completed: true,
          }),
        ],
      }),
    ).toBe(
      "[Staff Member] Follow up on housing\n[Staff Member] Schedule next meeting",
    );
  });

  test("keeps only the run that produced the meeting's current notes", () => {
    expect(
      actionItemsFor({
        notetakingPipelineRunId: "run-2",
        meetingActionItems: [
          makeActionItem({ generatedTask: "From a superseded run" }),
          makeActionItem({
            generatedTask: "Added by staff in the app",
            pipelineRunId: null,
          }),
          makeActionItem({
            generatedTask: "From the current run",
            pipelineRunId: "run-2",
          }),
        ],
      }),
    ).toBe("[Staff Member] From the current run");
  });

  test("keeps every row when the meeting has no pipeline run recorded", () => {
    expect(
      actionItemsFor({
        notetakingPipelineRunId: null,
        meetingActionItems: [
          makeActionItem({ pipelineRunId: "backfill-migration" }),
          makeActionItem({ generatedTask: "Schedule next meeting" }),
        ],
      }),
    ).toBe(
      "[Staff Member] Follow up on housing\n[Staff Member] Schedule next meeting",
    );
  });

  test("falls back to structuredActionItems when there are no rows", () => {
    expect(actionItemsFor({ meetingActionItems: [] })).toBe(
      "[Staff Member] Follow up on housing (due: 2026-04-01)\n[Client] Schedule next meeting",
    );
  });

  test("is null when every row belongs to a superseded run — the JSON column is staler still", () => {
    expect(
      actionItemsFor({
        notetakingPipelineRunId: "run-2",
        meetingActionItems: [makeActionItem({ pipelineRunId: "run-1" })],
      }),
    ).toBeNull();
  });

  test("drops the assignee prefix when a row has no assignee", () => {
    // Rows the backfill migration created from JSON without an assignee.
    expect(
      actionItemsFor({
        meetingActionItems: [
          makeActionItem({ assignee: "" }),
          makeActionItem({ assignee: "Client", generatedTask: "Call the PO" }),
        ],
      }),
    ).toBe("Follow up on housing\n[Client] Call the PO");
  });

  test("is null when the meeting has no action items anywhere", () => {
    expect(
      actionItemsFor({ meetingActionItems: [], structuredActionItems: null }),
    ).toBeNull();
  });

  test("is null, not an empty string, for an empty structuredActionItems array", () => {
    expect(
      actionItemsFor({ meetingActionItems: [], structuredActionItems: [] }),
    ).toBeNull();
  });
});
