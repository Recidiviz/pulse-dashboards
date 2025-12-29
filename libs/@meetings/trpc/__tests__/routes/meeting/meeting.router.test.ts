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

import { describe, expect, test, vi } from "vitest";

import { PostMeetingProcessingStatus } from "~@meetings/prisma/client";
import {
  mockCloudTasksClient,
  testkit,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeClients, fakeMeeting } from "~@meetings/trpc/test/setup/seed";

const FAKE_DATE = new Date("2025-10-19");

describe("meeting router", () => {
  describe("getDetails", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.getDetails.query({
          clientId: fakeClients[0].personId,
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should return meeting details if it exists", async () => {
      const result = await testTRPCClient.v1.meeting.getDetails.query({
        clientId: fakeClients[0].personId,
        meetingId: fakeMeeting.id,
      });

      expect(result).toEqual({
        id: fakeMeeting.id,
        startTime: fakeMeeting.startTime,
        endTime: null,
        postMeetingProcessingStatus: PostMeetingProcessingStatus.NOT_STARTED,
        userNotepadNotes: "Sample meeting notes.",
        actionItems: "1. Follow up on employment status\n2. Schedule next check-in\n3. Review case file",
        criticalUpdates: "Client reported new job opportunity. Upcoming court date next week.",
        meetingSummary: "Productive meeting discussing client progress and upcoming milestones.",
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
  });

  describe("getSignedUrlForRecording", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.getSignedUrlForRecording.query({
          clientId: fakeClients[0].personId,
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Returns a signed URL for the meeting recording", async () => {
      const result =
        await testTRPCClient.v1.meeting.getSignedUrlForRecording.query({
          clientId: fakeClients[0].personId,
          meetingId: fakeMeeting.id,
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
          clientId: fakeClients[0].personId,
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should delete meeting if it exists", async () => {
      await testTRPCClient.v1.meeting.discardMeeting.mutate({
        clientId: fakeClients[0].personId,
        meetingId: fakeMeeting.id,
      });

      const meetingsInDb = await testPrismaClient.meeting.findMany({
        where: { id: fakeMeeting.id },
      });

      expect(meetingsInDb).toEqual([]);
    });
  });

  describe("updateNotes", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.updateNotes.mutate({
          clientId: fakeClients[0].personId,
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
        clientId: fakeClients[0].personId,
        meetingId: fakeMeeting.id,
        userNotepadNotes: "These are some notes",
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeMeeting.id },
      });

      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          userNotepadNotes: "These are some notes",
        }),
      );
    });

    test("Should update all fields including actionItems, criticalUpdates, and meetingSummary", async () => {
      await testTRPCClient.v1.meeting.updateNotes.mutate({
        clientId: fakeClients[0].personId,
        meetingId: fakeMeeting.id,
        userNotepadNotes: "Updated notes",
        actionItems: "1. New action item\n2. Another action",
        criticalUpdates: "Critical update information",
        meetingSummary: "Updated summary of the meeting",
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeMeeting.id },
      });

      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          userNotepadNotes: "Updated notes",
          actionItems: "1. New action item\n2. Another action",
          criticalUpdates: "Critical update information",
          meetingSummary: "Updated summary of the meeting",
        }),
      );
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
          clientId: fakeClients[0].personId,
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
        clientId: fakeClients[0].personId,
        meetingId: fakeMeeting.id,
        userNotepadNotes: "These are some notes",
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeMeeting.id },
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
        clientId: fakeClients[0].personId,
        meetingId: fakeMeeting.id,
        userNotepadNotes: "These are some notes",
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeMeeting.id },
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
                  meetingId: fakeMeeting.id,
                }),
              ),
              httpMethod: "POST",
              url: "https://test-server.app/stitch-audio",
              oidcToken: {
                serviceAccountEmail:
                  "test-service-account-email@test-project.iam.gserviceaccount.com",
              },
            },
          },
        }),
      );
    });
  });
});
