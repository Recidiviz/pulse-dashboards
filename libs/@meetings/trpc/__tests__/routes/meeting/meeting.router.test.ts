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
  ApprovalValue,
  NoteSection,
  OutputVoteTab,
  OutputVoteValue,
  PostMeetingProcessingStatus,
} from "~@meetings/prisma/client";
import * as meetingsTasks from "~@meetings/tasks";
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
    audioPlaybackEnabled: enabled,
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
        meetingTypeCategory: null,
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
        currentOutputVotes: null,
        caseNoteEditedAt: null,
        actionItemsEditedAt: null,
        approvals: {
          caseNote: false,
          actionItems: false,
        },
        validationErrorType: null,
        transcriptDeletedAt: null,
        audioUrl: null,
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
        audioPlaybackEnabled: false,
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
          meetingTypeCategory: null,
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
          currentOutputVotes: null,
          caseNoteEditedAt: null,
          actionItemsEditedAt: null,
          approvals: {
            caseNote: false,
            actionItems: false,
          },
          validationErrorType: null,
          transcriptDeletedAt: null,
          audioUrl: null,
          transcription: undefined,
        });
      } finally {
        delete AGENCY_CONFIGS["US_NE"];
      }
    });

    test("Should return staffFeedback and currentOutputVotes tied to the latest feedback content", async () => {
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
            outputsPipelineRunId: currentPipelineRunId,
          },
        });

        // A vote against the *previous* feedback content - should be ignored.
        await testPrismaClient.outputVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: OutputVoteValue.UP,
            tab: OutputVoteTab.STAFF_FEEDBACK,
            pipelineRunId: oldPipelineRunId,
          },
        });

        // Two votes against the current feedback. The most recent (DOWN) wins.
        await testPrismaClient.outputVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: OutputVoteValue.UP,
            tab: OutputVoteTab.STAFF_FEEDBACK,
            pipelineRunId: currentPipelineRunId,
          },
        });
        await testPrismaClient.outputVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: OutputVoteValue.DOWN,
            tab: OutputVoteTab.STAFF_FEEDBACK,
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
        expect(result.currentOutputVotes).toEqual({
          [OutputVoteTab.STAFF_FEEDBACK]: {
            vote: OutputVoteValue.DOWN,
            message: null,
          },
        });
      } finally {
        delete AGENCY_CONFIGS["US_NE"];
      }
    });

    test("Should ignore votes from other users when reporting currentOutputVotes", async () => {
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
            outputsPipelineRunId: pipelineRunId,
          },
        });

        // Another user voted, but the test client is fakeStaff[0].
        await testPrismaClient.outputVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: "someone-else@example.com",
            vote: OutputVoteValue.UP,
            tab: OutputVoteTab.STAFF_FEEDBACK,
            pipelineRunId,
          },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.currentOutputVotes).toBeNull();
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
            outputsPipelineRunId: pipelineRunId,
          },
        });

        // A real vote exists for this user — should also be hidden when off.
        await testPrismaClient.outputVote.create({
          data: {
            meetingId: fakeActiveMeeting.id,
            voterEmail: fakeStaff[0].email,
            vote: OutputVoteValue.UP,
            tab: OutputVoteTab.STAFF_FEEDBACK,
            pipelineRunId,
          },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.staffFeedback).toBeNull();
        expect(result.currentOutputVotes).toBeNull();
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

    describe("audioUrl", () => {
      function setUSNEAudioPlayback(enabled: boolean) {
        AGENCY_CONFIGS["US_NE"] = {
          baseVersion: 1,
          name: "Nebraska",
          stateCode: "US_NE",
          version: 1,
          showTranscriptions: true,
          staffFeedbackEnabled: false,
          audioPlaybackEnabled: enabled,
          audioTTLDays: 30,
          transcriptTTLDays: 30,
          meetingTypes: [],
          keywords: [],
          glossary: {},
          rules: [],
          outputs: [],
        };
      }

      afterEach(() => {
        delete AGENCY_CONFIGS["US_NE"];
      });

      test("Should return audioUrl: null when audioPlaybackEnabled is false", async () => {
        setUSNEAudioPlayback(false);
        await testPrismaClient.meeting.update({
          where: { id: fakeActiveMeeting.id },
          data: { finalRecordingGCSPath: "meeting-1/final.m4a" },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.audioUrl).toBeNull();
      });

      test("Should return audioUrl: null when finalRecordingGCSPath is null", async () => {
        setUSNEAudioPlayback(true);

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.audioUrl).toBeNull();
      });

      test("Should return audioUrl: null when audio has been deleted", async () => {
        setUSNEAudioPlayback(true);
        await testPrismaClient.meeting.update({
          where: { id: fakeActiveMeeting.id },
          data: {
            finalRecordingGCSPath: "meeting-1/final.m4a",
            audioDeletedAt: new Date("2026-01-01"),
          },
        });

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.audioUrl).toBeNull();
      });

      test("Should return a signed audioUrl when enabled and recording exists", async () => {
        setUSNEAudioPlayback(true);
        await testPrismaClient.meeting.update({
          where: { id: fakeActiveMeeting.id },
          data: { finalRecordingGCSPath: "meeting-1/final.m4a" },
        });
        vi.spyOn(
          meetingsTasks,
          "getSignedUrlForRecording",
        ).mockResolvedValueOnce("https://signed.example.com/audio.m4a");

        const result = await testTRPCClient.v1.meeting.getDetails.query({
          meetingId: fakeActiveMeeting.id,
        });

        expect(result.audioUrl).toBe("https://signed.example.com/audio.m4a");
      });
    });

    test("Should reflect the latest NoteApproval per section tied to the active notetakingPipelineRunId", async () => {
      const currentPipelineRunId = "notes-run-current";
      const oldPipelineRunId = "notes-run-old";

      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { notetakingPipelineRunId: currentPipelineRunId },
      });

      // Stale approval against a prior run; should be ignored.
      await testPrismaClient.noteApproval.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          approverEmail: fakeStaff[0].email,
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.APPROVED,
          pipelineRunId: oldPipelineRunId,
        },
      });

      // CASE_NOTE: APPROVED then UNAPPROVED, so not approved.
      await testPrismaClient.noteApproval.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          approverEmail: fakeStaff[0].email,
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.APPROVED,
          pipelineRunId: currentPipelineRunId,
        },
      });
      await testPrismaClient.noteApproval.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          approverEmail: fakeStaff[0].email,
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.UNAPPROVED,
          pipelineRunId: currentPipelineRunId,
        },
      });

      // ACTION_ITEMS: approved.
      await testPrismaClient.noteApproval.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          approverEmail: fakeStaff[0].email,
          section: NoteSection.ACTION_ITEMS,
          value: ApprovalValue.APPROVED,
          pipelineRunId: currentPipelineRunId,
        },
      });

      const result = await testTRPCClient.v1.meeting.getDetails.query({
        meetingId: fakeActiveMeeting.id,
      });

      expect(result.approvals).toEqual({
        caseNote: false,
        actionItems: true,
      });
    });

    test("Should return approvals: all false when notetakingPipelineRunId is null", async () => {
      // Even if there are stray NoteApproval rows from prior runs, none of
      // them should count when the meeting has no active pipeline run.
      await testPrismaClient.noteApproval.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          approverEmail: fakeStaff[0].email,
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.APPROVED,
          pipelineRunId: "some-old-run",
        },
      });

      const result = await testTRPCClient.v1.meeting.getDetails.query({
        meetingId: fakeActiveMeeting.id,
      });

      expect(result.approvals).toEqual({
        caseNote: false,
        actionItems: false,
      });
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

    test("Should set the matching *EditedAt only for fields that are included", async () => {
      await testTRPCClient.v1.meeting.updateNotes.mutate({
        meetingId: fakeActiveMeeting.id,
        caseNote: "Edited case note",
      });

      const after = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      expect(after?.caseNoteEditedAt).toBeInstanceOf(Date);
      expect(after?.actionItemsEditedAt).toBeNull();
    });

    test("Should not change *EditedAt when the field is omitted, even if other fields are updated", async () => {
      // Seed a known caseNoteEditedAt, then update only actionItems.
      const seededEditedAt = new Date("2026-05-01T00:00:00.000Z");
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { caseNoteEditedAt: seededEditedAt },
      });

      await testTRPCClient.v1.meeting.updateNotes.mutate({
        meetingId: fakeActiveMeeting.id,
        actionItems: ["x"],
      });

      const after = await testPrismaClient.meeting.findUnique({
        where: { id: fakeActiveMeeting.id },
      });

      expect(after?.caseNoteEditedAt).toEqual(seededEditedAt);
      expect(after?.actionItemsEditedAt).toBeInstanceOf(Date);
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
        testTRPCClient.v1.meeting.submitOutputVote.mutate({
          meetingId: fakeActiveMeeting.id,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
        }),
      ).rejects.toMatchObject({
        message: "Staff feedback is not enabled for this agency",
        data: { code: "FORBIDDEN" },
      });

      const votes = await testPrismaClient.outputVote.findMany({
        where: { meetingId: fakeActiveMeeting.id },
      });
      expect(votes).toHaveLength(0);
    });

    test("Should throw NOT_FOUND when the meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.submitOutputVote.mutate({
          meetingId: "non-existent-meeting-id",
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should reject voting when no staff feedback has been generated yet", async () => {
      await expect(
        testTRPCClient.v1.meeting.submitOutputVote.mutate({
          meetingId: fakeActiveMeeting.id,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
        }),
      ).rejects.toMatchObject({
        data: { code: "PRECONDITION_FAILED" },
      });

      const votes = await testPrismaClient.outputVote.findMany({
        where: { meetingId: fakeActiveMeeting.id },
      });
      expect(votes).toHaveLength(0);
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
        testTRPCClient.v1.meeting.submitOutputVote.mutate({
          meetingId: fakeMeetingStaff1.id,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
        }),
      ).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });

      const votes = await testPrismaClient.outputVote.findMany({
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
          outputsPipelineRunId: pipelineRunId,
        },
      });

      await testTRPCClient.v1.meeting.submitOutputVote.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: OutputVoteValue.UP,
        tab: OutputVoteTab.STAFF_FEEDBACK,
      });
      await testTRPCClient.v1.meeting.submitOutputVote.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: OutputVoteValue.DOWN,
        tab: OutputVoteTab.STAFF_FEEDBACK,
      });
      await testTRPCClient.v1.meeting.submitOutputVote.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: OutputVoteValue.UP,
        tab: OutputVoteTab.STAFF_FEEDBACK,
      });

      const votes = await testPrismaClient.outputVote.findMany({
        where: { meetingId: fakeActiveMeeting.id },
        orderBy: { createdAt: "asc" },
      });

      expect(votes).toHaveLength(3);
      expect(votes.map((v) => v.vote)).toEqual([
        OutputVoteValue.UP,
        OutputVoteValue.DOWN,
        OutputVoteValue.UP,
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

  describe("submitOutputVoteMessage", () => {
    const pipelineRunId = "pipeline-run-feedback";

    beforeEach(() => {
      setUSNEStaffFeedback(true);
    });

    afterEach(() => {
      delete AGENCY_CONFIGS["US_NE"];
    });

    test("Should throw FORBIDDEN when staffFeedbackEnabled is false for the agency", async () => {
      setUSNEStaffFeedback(false);

      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: fakeActiveMeeting.id,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        message: "Staff feedback is not enabled for this agency",
        data: { code: "FORBIDDEN" },
      });
    });

    test("Should throw NOT_FOUND when the meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: "non-existent-meeting-id",
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should throw FORBIDDEN when the user did not create the meeting", async () => {
      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: fakeMeetingStaff1.id,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });
    });

    test("Should throw PRECONDITION_FAILED when no vote has been cast", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { outputsPipelineRunId: pipelineRunId },
      });

      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: fakeActiveMeeting.id,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        message:
          "Cannot submit a feedback message without casting a vote first",
        data: { code: "PRECONDITION_FAILED" },
      });
    });

    test("Should throw PRECONDITION_FAILED when the meeting has no feedback pipeline run", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { outputsPipelineRunId: null },
      });
      await testPrismaClient.outputVote.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          voterEmail: fakeStaff[0].email,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          pipelineRunId,
        },
      });

      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: fakeActiveMeeting.id,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        data: { code: "PRECONDITION_FAILED" },
      });
    });

    test("Should throw PRECONDITION_FAILED when the only vote is against an older feedback version", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { outputsPipelineRunId: pipelineRunId },
      });
      await testPrismaClient.outputVote.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          voterEmail: fakeStaff[0].email,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          pipelineRunId: "pipeline-run-old",
        },
      });

      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: fakeActiveMeeting.id,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        data: { code: "PRECONDITION_FAILED" },
      });
    });

    test("Should attach the message to the vote for the current feedback version", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { outputsPipelineRunId: pipelineRunId },
      });

      await testTRPCClient.v1.meeting.submitOutputVote.mutate({
        meetingId: fakeActiveMeeting.id,
        vote: OutputVoteValue.UP,
        tab: OutputVoteTab.STAFF_FEEDBACK,
      });

      await testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
        meetingId: fakeActiveMeeting.id,
        tab: OutputVoteTab.STAFF_FEEDBACK,
        message: "The housing suggestion was spot on.",
      });

      const votes = await testPrismaClient.outputVote.findMany({
        where: { meetingId: fakeActiveMeeting.id },
      });
      expect(votes).toHaveLength(1);
      expect(votes[0]).toMatchObject({
        vote: OutputVoteValue.UP,
        tab: OutputVoteTab.STAFF_FEEDBACK,
        pipelineRunId,
        message: "The housing suggestion was spot on.",
      });
    });

    test("Should only attach the message to the most recent matching vote", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { outputsPipelineRunId: pipelineRunId },
      });

      const olderVote = await testPrismaClient.outputVote.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          voterEmail: fakeStaff[0].email,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          pipelineRunId,
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      });
      const newerVote = await testPrismaClient.outputVote.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          voterEmail: fakeStaff[0].email,
          vote: OutputVoteValue.DOWN,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          pipelineRunId,
          createdAt: new Date("2026-04-02T00:00:00.000Z"),
        },
      });

      await testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
        meetingId: fakeActiveMeeting.id,
        tab: OutputVoteTab.STAFF_FEEDBACK,
        message: "Latest thoughts.",
      });

      const updatedOlder = await testPrismaClient.outputVote.findUnique({
        where: { id: olderVote.id },
      });
      const updatedNewer = await testPrismaClient.outputVote.findUnique({
        where: { id: newerVote.id },
      });
      expect(updatedOlder?.message).toBeNull();
      expect(updatedNewer?.message).toBe("Latest thoughts.");
    });

    test("Should match the vote for the requested tab only", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { outputsPipelineRunId: pipelineRunId },
      });

      await testPrismaClient.outputVote.create({
        data: {
          meetingId: fakeActiveMeeting.id,
          voterEmail: fakeStaff[0].email,
          vote: OutputVoteValue.UP,
          tab: OutputVoteTab.ACTION_ITEMS,
          pipelineRunId,
        },
      });

      await expect(
        testTRPCClient.v1.meeting.submitOutputVoteMessage.mutate({
          meetingId: fakeActiveMeeting.id,
          tab: OutputVoteTab.STAFF_FEEDBACK,
          message: "Great feedback!",
        }),
      ).rejects.toMatchObject({
        data: { code: "PRECONDITION_FAILED" },
      });
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

  describe("approveSection", () => {
    test("Should throw NOT_FOUND when the meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.approveSection.mutate({
          meetingId: "non-existent-meeting-id",
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.APPROVED,
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should throw PRECONDITION_FAILED when no notes have been generated", async () => {
      // fakeActiveMeeting starts with notetakingPipelineRunId: null.
      await expect(
        testTRPCClient.v1.meeting.approveSection.mutate({
          meetingId: fakeActiveMeeting.id,
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.APPROVED,
        }),
      ).rejects.toMatchObject({
        data: { code: "PRECONDITION_FAILED" },
      });
    });

    test("Should throw FORBIDDEN when the user did not create the meeting", async () => {
      // fakeMeetingStaff1 is owned by fakeStaff[1]; test client authenticates
      // as fakeStaff[0].
      await testPrismaClient.meeting.update({
        where: { id: fakeMeetingStaff1.id },
        data: { notetakingPipelineRunId: "some-pipeline-run" },
      });

      await expect(
        testTRPCClient.v1.meeting.approveSection.mutate({
          meetingId: fakeMeetingStaff1.id,
          section: NoteSection.CASE_NOTE,
          value: ApprovalValue.APPROVED,
        }),
      ).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });

      const approvals = await testPrismaClient.noteApproval.findMany({
        where: { meetingId: fakeMeetingStaff1.id },
      });
      expect(approvals).toHaveLength(0);
    });

    test("Should append a row on every call (history-preserving)", async () => {
      const pipelineRunId = "notes-run-history";
      await testPrismaClient.meeting.update({
        where: { id: fakeActiveMeeting.id },
        data: { notetakingPipelineRunId: pipelineRunId },
      });

      await testTRPCClient.v1.meeting.approveSection.mutate({
        meetingId: fakeActiveMeeting.id,
        section: NoteSection.CASE_NOTE,
        value: ApprovalValue.APPROVED,
      });
      await testTRPCClient.v1.meeting.approveSection.mutate({
        meetingId: fakeActiveMeeting.id,
        section: NoteSection.CASE_NOTE,
        value: ApprovalValue.UNAPPROVED,
      });
      await testTRPCClient.v1.meeting.approveSection.mutate({
        meetingId: fakeActiveMeeting.id,
        section: NoteSection.CASE_NOTE,
        value: ApprovalValue.APPROVED,
      });

      const rows = await testPrismaClient.noteApproval.findMany({
        where: { meetingId: fakeActiveMeeting.id },
        orderBy: { createdAt: "asc" },
      });

      expect(rows).toHaveLength(3);
      expect(rows.map((r) => r.value)).toEqual([
        ApprovalValue.APPROVED,
        ApprovalValue.UNAPPROVED,
        ApprovalValue.APPROVED,
      ]);
      expect(
        rows.every(
          (r) =>
            r.approverEmail === fakeStaff[0].email &&
            r.pipelineRunId === pipelineRunId &&
            r.section === NoteSection.CASE_NOTE,
        ),
      ).toBe(true);
    });
  });
});
