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

function makeMeeting(
  overrides: Partial<LabelStudioMeeting> = {},
): LabelStudioMeeting {
  return {
    id: "meeting-1",
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
    criticalUpdates: ["Safety concern - details noted"],
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
        action_items: [
          "[Staff Member] Follow up on housing (due: 2026-04-01)",
          "[Client] Schedule next meeting",
        ],
        critical_updates: "Safety concern - details noted",
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
        endTime: null,
        caseNote: null,
        structuredActionItems: null,
        criticalUpdates: null,
      }),
      "US_NE",
    );

    expect(task.audio).toBeNull();
    expect(task.meta.Duration).toBeNull();
    expect(task.case_note).toBeNull();
    expect(task.action_items).toBeNull();
    expect(task.critical_updates).toBeNull();
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
});
