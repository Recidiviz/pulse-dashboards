// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { AUDIO_FORMATS } from "~@meetings/config";
import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import {
  FeedbackVoteValue,
  PostMeetingProcessingStatus,
} from "~@meetings/prisma/client";
import {
  mockCloudTasksClient,
  testkit,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import {
  fakeActiveMeeting,
  fakeInactiveMeeting,
  fakeMeetingStaff1,
  fakeStaff,
  pseudoMeetingType,
} from "~@meetings/trpc/test/setup/seed";

const FAKE_DATE = new Date("2025-10-19");

// Default agency config for US_NE with staffFeedbackEnabled toggled on. The
// existing fixtures use US_NE, but the global default for the flag is `false`,
// so any test exercising staff-feedback paths must opt-in.
function setUSNEStaffFeedback(enabled: boolean) {
  AGENCY_CONFIGS["US_NE"] = {
    baseVersion: 1,
    name: "Nebraska",
    stateCode: "US_NE",
    version: 1,
    showTranscriptions: true,
    staffFeedbackEnabled: enabled,
    audioTTLDays: 30,
    transcriptTTLDays: 30,
    meetingTypes: [],
    keywords: [],
    glossary: {},
    rules: [],
    outputs: [],
  };
}

describe("meeting router", () => {
  describe("getDetails", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.getDetails.query({
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should return meeting details if it exists", async () => {
      // remove US_NE in AGENCY_CONFIGS, so showTranscriptions defaults to true
      delete AGENCY_CONFIGS["US_NE"];
      const result = await testTRPCClient.v1.meeting.getDetails.query({
        meetingId: fakeActiveMeeting.id,
      });

      expect(result).toEqual({
        id: fakeActiveMeeting.id,
        meetingType: pseudoMeetingType,
        startTime: fakeActiveMeeting.startTime,
        endTime: null,
        durationMs: null,
        postMeetingProcessingStatus: PostMeetingProcessingStatus.NOT_STARTED,
        userNotepadNotes: "Sample meeting notes.",
        caseNote: fakeActiveMeeting.caseNote,
        staffEmail: fakeActiveMeeting.staffEmail,
        actionItems: [],
        structuredActionItems: [],
        criticalUpdates: [],
        meetingSummary: [],
        staffFeedback: null,
        currentFeedbackVote: null,
        validationErrorType: null,
        transcriptDeletedAt: null,
        transcription: {
          confidence: 0.95,
          summary: "This is a sample summary of the meeting.",
          // These should be ordered by startTimeMs
          utterances: [
            {
              confidence: 0.98,
              endTimeMs: 3000,
              speaker: "Speaker A",
              startTimeMs: 0,
              text: "Hello, this is a sample utterance.",
            },
            {
              confidence: 0.98,
              endTimeMs: 6000,
              speaker: "Speaker B",
              startTimeMs: 3000,
              text: "Hello, this is second a sample utterance.",
            },
          ],
        },
      });
    });

    test("Should return meeting details if it exists without transcription", async () => {
      // Set showTranscriptions: false for US_NE via the agency config
      AGENCY_CONFIGS["US_NE"] = {
        baseVersion: 1,
        name: "Nebraska",
        stateCode: "US_NE",
        version: 1,
        showTranscriptions: false,
        staffFeedbackEnabled: false,
        audioTTLDays: 30,
        transcriptTTLDays: 30,
        meetingTypes: [],
        keywords: [],
        glossary: {},
        rules: [],
        outputs: [],
      };

      try {
        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result).toEqual({
          id: fakeActiveMeeting.id,
          meetingType: pseudoMeetingType,
          startTime: fakeActiveMeeting.startTime,
          endTime: null,
          durationMs: null,
          postMeetingProcessingStatus: PostMeetingProcessingStatus.NOT_STARTED,
          userNotepadNotes: "Sample meeting notes.",
          caseNote: fakeActiveMeeting.caseNote,
          staffEmail: fakeActiveMeeting.staffEmail,
          actionItems: [],
          structuredActionItems: [],
          criticalUpdates: [],
          meetingSummary: [],
          staffFeedback: null,
          currentFeedbackVote: null,
          validationErrorType: null,
          transcriptDeletedAt: null,
          transcription: undefined,
        });
      } finally {
        delete AGENCY_CONFIGS["US_NE"];
      }
    });

    test("Should return staffFeedback and currentFeedbackVote tied to the latest feedback content", async () => {
      setUSNEStaffFeedback(true);
      try {
        const generatedAt = new Date("2026-04-01T00:00:00.000Z");
        const currentPipelineRunId = "pipeline-run-current";
        const oldPipelineRunId = "pipeline-run-old";

        await testPrismaClient.meeting.update({
          where: { id: fakeActiveMeeting.id },
          data: {
            staffFeedback: {
              whatYouDidWell: [
                "You acknowledged the client's concern about housing.",
              ],
              growthOpportunities: ["A reflection might have helped here."],
            },
            staffFeedbackGeneratedAt: generatedAt,
            staffFeedbackPipelineRunId: currentPipelineRunId,
          },
        });

        // A vote against the *previous* feedback content - should be ignored.
        await testPrismaClient.feedbackVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: FeedbackVoteValue.UP,
            pipelineRunId: oldPipelineRunId,
          },
        });

        // Two votes against the current feedback. The most recent (DOWN) wins.
        await testPrismaClient.feedbackVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: FeedbackVoteValue.UP,
            pipelineRunId: currentPipelineRunId,
          },
        });
        await testPrismaClient.feedbackVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: FeedbackVoteValue.DOWN,
            pipelineRunId: currentPipelineRunId,
          },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.staffFeedback).toEqual({
          whatYouDidWell: [
            "You acknowledged the client's concern about housing.",
          ],
          growthOpportunities: ["A reflection might have helped here."],
          generatedAt,
        });
        expect(result.currentFeedbackVote).toBe(FeedbackVoteValue.DOWN);
      } finally {
        delete AGENCY_CONFIGS["US_NE"];
      }
    });

    test("Should ignore votes from other users when reporting currentFeedbackVote", async () => {
      setUSNEStaffFeedback(true);
      try {
        const generatedAt = new Date("2026-04-01T00:00:00.000Z");
        const pipelineRunId = "pipeline-run-abc";

        await testPrismaClient.meeting.update({
          where: { id: fakeActiveMeeting.id },
          data: {
            staffFeedback: {
              whatYouDidWell: [],
              growthOpportunities: [],
            },
            staffFeedbackGeneratedAt: generatedAt,
            staffFeedbackPipelineRunId: pipelineRunId,
          },
        });

        // Another user voted, but the test client is fakeStaff[0].
        await testPrismaClient.feedbackVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: "someone-else@example.com",
            vote: FeedbackVoteValue.UP,
            pipelineRunId,
          },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.currentFeedbackVote).toBeNull();
      } finally {
        delete AGENCY_CONFIGS["US_NE"];
      }
    });

    test("Should return staffFeedback: null when staffFeedbackEnabled is false for the agency", async () => {
      setUSNEStaffFeedback(false);
      try {
        const generatedAt = new Date("2026-04-01T00:00:00.000Z");
        const pipelineRunId = "pipeline-run-disabled";

        await testPrismaClient.meeting.update({
          where: { id: fakeActiveMeeting.id },
          data: {
            staffFeedback: {
              whatYouDidWell: ["This should be hidden."],
              growthOpportunities: [],
            },
            staffFeedbackGeneratedAt: generatedAt,
            staffFeedbackPipelineRunId: pipelineRunId,
          },
        });

        // A real vote exists for this user — should also be hidden when off.
        await testPrismaClient.feedbackVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: FeedbackVoteValue.UP,
            pipelineRunId,
          },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.staffFeedback).toBeNull();
        expect(result.currentFeedbackVote).toBeNull();
      } finally {
        delete AGENCY_CONFIGS["US_NE"];
      }
    });

    test("Should parse JSON-encoded actionItems and criticalUpdates from database", async () => {
      // This test uses fakeInactiveMeeting which has JSON-encoded arrays for actionItems and criticalUpdates
      const result = await testTRPCClient.v1.meeting.getDetails.query({
        meetingId: fakeInactiveMeeting.id,
      });

      // Verify that the JSON strings are properly parsed into arrays
      expect(result.actionItems).toEqual([
        "Follow up on employment status",
        "Schedule next check-in",
        "Review case file",
      ]);
      expect(result.criticalUpdates).toEqual([
        "Employment - New: Client reported new job opportunity",
        "Legal - Change: Upcoming court date next week",
      ]);
    });
  });

  describe("createSignedUrlForRecording", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.createSignedUrlForRecording.mutate({
          meetingId: "non-existent-meeting-id",
          contentType: AUDIO_FORMATS.m4a.contentType,
          fileExtension: AUDIO_FORMATS.m4a.extension,
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Returns a signed URL for the meeting recording", async () => {
      const result =
        await testTRPCClient.v1.meeting.createSignedUrlForRecording.mutate({
          meetingId: fakeActiveMeeting.id,
          contentType: AUDIO_FORMATS.m4a.contentType,
          fileExtension: AUDIO_FORMATS.m4a.extension,
        });

      expect(result).toEqual(
        "storage.googleapis.com/test-audio-bucket/meeting-1/1.m4a",
      );
    });
  });

  describe("discardMeeting", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.discardMeeting.mutate({
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should delete meeting if it exists", async () => {
      await testTRPCClient.v1.meeting.discardMeeting.mutate({
        meetingId: fakeActiveMeeting.id,
      });

      const meetingsInDb = await testPrismaClient.meeting.findMany({
        where: { id: fakeActiveMeeting.id },
      });

      expect(meetingsInDb).toEqual([]);
    });
  });

  describe("updateNotes", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.updateNotes.mutate({
          meetingId: "non-existent-meeting-id",
          userNotepadNotes: "These are some notes",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should update notes if meeting exists", async () => {
      await testTRPCClient.v1.meeting.updateNotes.mutate({
        meetingId: fakeActiveMeeting.id,
        userNotepadNotes: "These are some notes",
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          userNotepadNotes: "These are some notes",
        }),
      );
    });

    test("Should update all fields including actionItems and criticalUpdates", async () => {
      await testTRPCClient.v1.meeting.updateNotes.mutate({
        meetingId: fakeActiveMeeting.id,
        userNotepadNotes: "Updated notes",
        actionItems: ["New action item", "Another action"],
        criticalUpdates: ["Critical update information"],
        caseNote: "Updated case note",
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          userNotepadNotes: "Updated notes",
          actionItems: ["New action item", "Another action"],
          criticalUpdates: ["Critical update information"],
          caseNote: "Updated case note",
        }),
      );
    });

    test("Should update only the specified field and leave other note fields unchanged", async () => {
      // Update only actionItems
      await testTRPCClient.v1.meeting.updateNotes.mutate({
        meetingId: fakeActiveMeeting.id,
        actionItems: ["1. New action item only"],
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      // actionItems should be updated
      expect(updatedMeeting?.actionItems).toEqual(["1. New action item only"]);

      // Other fields should remain unchanged from their original values
      expect(updatedMeeting?.userNotepadNotes).toEqual(
        fakeActiveMeeting.userNotepadNotes,
      );
      expect(updatedMeeting?.criticalUpdates).toEqual(
        fakeActiveMeeting.criticalUpdates,
      );
      expect(updatedMeeting?.meetingSummary).toEqual(
        fakeActiveMeeting.meetingSummary,
      );
      expect(updatedMeeting?.caseNote).toEqual(fakeActiveMeeting.caseNote);
    });
  });

  describe("voteFeedback", () => {
    beforeEach(() => {
      setUSNEStaffFeedback(true);
    });

    afterEach(() => {
      delete AGENCY_CONFIGS["US_NE"];
    });

    test("Should throw FORBIDDEN when staffFeedbackEnabled is false for the agency", async () => {
      setUSNEStaffFeedback(false);

      await expect(
        testTRPCClient.v1.meeting.voteFeedback.mutate({
          meetingId: fakeActiveMeeting.id,
          vote: FeedbackVoteValue.UP,
        }),
      ).rejects.toMatchObject({
        message: "Staff feedback is not enabled for this agency",
        data: { code: "FORBIDDEN" },
      });

      const votes = await testPrismaClient.feedbackVote.findMany({
        where: { meetingId: fakeActiveMeeting.id },
      });
      expect(votes).toHaveLength(0);
    });

    test("Should throw NOT_FOUND when the meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.voteFeedback.mutate({
          meetingId: "non-existent-meeting-id",
          vote: FeedbackVoteValue.UP,
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should throw PRECONDITION_FAILED when no staff feedback has been generated", async () => {
      await expect(
        testTRPCClient.v1.meeting.voteFeedback.mutate({
          meetingId: fakeActiveMeeting.id,
          vote: FeedbackVoteValue.UP,
        }),
      ).rejects.toMatchObject({
        data: { code: "PRECONDITION_FAILED" },
      });
    });

    test("Should throw FORBIDDEN when the user did not create the meeting", async () => {
      // fakeMeetingStaff1 was created by fakeStaff[1], but the test client
      // authenticates as fakeStaff[0].
      await testPrismaClient.meeting.update({
        where: { id: fakeMeetingStaff1.id },
        data: {
          staffFeedback: {
            whatYouDidWell: [],
            growthOpportunities: [],
          },
          staffFeedbackGeneratedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      });

      await expect(
        testTRPCClient.v1.meeting.voteFeedback.mutate({
          meetingId: fakeMeetingStaff1.id,
          vote: FeedbackVoteValue.UP,
        }),
      ).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });

      const votes = await testPrismaClient.feedbackVote.findMany({
        where: { meetingId: fakeMeetingStaff1.id },
      });
      expect(votes).toHaveLength(0);
    });

    test("Should append a row on every call (history-preserving)", async () => {
      const pipelineRunId = "pipeline-run-xyz";
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: {
          staffFeedback: {
            whatYouDidWell: [],
            growthOpportunities: [],
          },
          staffFeedbackGeneratedAt: new Date("2026-04-01T00:00:00.000Z"),
          staffFeedbackPipelineRunId: pipelineRunId,
        },
      });

      await testTRPCClient.v1.meeting.voteFeedback.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: FeedbackVoteValue.UP,
      });
      await testTRPCClient.v1.meeting.voteFeedback.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: FeedbackVoteValue.DOWN,
      });
      await testTRPCClient.v1.meeting.voteFeedback.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: FeedbackVoteValue.UP,
      });

      const votes = await testPrismaClient.feedbackVote.findMany({
        where: { meetingId: fakeActiveMeeting.id },
        orderBy: { createdAt: "asc" },
      });

      expect(votes).toHaveLength(3);
      expect(votes.map((v) => v.vote)).toEqual([
        FeedbackVoteValue.UP,
        FeedbackVoteValue.DOWN,
        FeedbackVoteValue.UP,
      ]);
      expect(
        votes.every(
          (v) =>
            v.voterEmail === fakeStaff[0].email &&
            v.pipelineRunId === pipelineRunId,
        ),
      ).toBe(true);
    });
  });

  describe("endMeeting", () => {
    beforeAll(() => {
      // // tell vitest we use mocked time
      vi.useFakeTimers();
      vi.setSystemTime(FAKE_DATE);
    });

    afterAll(() => {
      // restoring date after the tests are complete
      vi.useRealTimers();
    });

    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.endMeeting.mutate({
          meetingId: "non-existent-meeting-id",
          userNotepadNotes: "These are some notes",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should set meeting end time but queue stitching error if there is a cloud task error", async () => {
      mockCloudTasksClient.createTask.mockRejectedValueOnce(new Error());

      await testTRPCClient.v1.meeting.endMeeting.mutate({
        meetingId: fakeActiveMeeting.id,
        userNotepadNotes: "These are some notes",
        endTime: FAKE_DATE,
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      // Check that end date and post processing status were updated
      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          endTime: FAKE_DATE,
          userNotepadNotes: "These are some notes",
          postMeetingProcessingStatus:
            PostMeetingProcessingStatus.STITCHING_ERROR,
        }),
      );

      // The error should still be reported to Sentry
      expect(testkit.reports()).toHaveLength(1);
    });

    test("Should set meeting end time and queue stitching", async () => {
      await testTRPCClient.v1.meeting.endMeeting.mutate({
        meetingId: fakeActiveMeeting.id,
        userNotepadNotes: "These are some notes",
        endTime: FAKE_DATE,
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      // Check that end date and post processing status were updated
      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          endTime: FAKE_DATE,
          userNotepadNotes: "These are some notes",
          postMeetingProcessingStatus:
            PostMeetingProcessingStatus.STITCHING_QUEUED,
        }),
      );

      expect(mockCloudTasksClient.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          parent:
            "projects/test-project/locations/us-central1/queues/test-stitching-task-queue",
          task: {
            httpRequest: {
              headers: {
                "Content-Type": "application/json",
              },
              body: Buffer.from(
                JSON.stringify({
                  stateCode: "US_NE",
                  meetingId: fakeActiveMeeting.id,
                }),
              ),
              httpMethod: "POST",
              url: "https://test-server.app/stitch-audio",
              oidcToken: {
                serviceAccountEmail:
                  "test-service-account-email@recidiviz-test.org",
              },
            },
          },
        }),
      );
    });
  });
});
