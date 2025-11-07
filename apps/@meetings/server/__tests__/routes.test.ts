// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { TranscriptUtterance } from "assemblyai";
import { describe, test, vi } from "vitest";

import {
  PostMeetingProcessingStatus,
  TranscriptionProvider,
} from "~@meetings/prisma/client";
import env from "~@meetings/server/env";
import {
  mockCloudTasksClient,
  setGetPayloadImp,
  testPrismaClient,
  testServer,
} from "~@meetings/server/test/setup";
import { fakeMeeting } from "~@meetings/server/test/setup/seed";
import * as tasks from "~@meetings/tasks";

const FAKE_TRANSCRIPT_OBJECT = {
  confidence: 0.95,
  utterances: [
    {
      confidence: 0.98,
      end: 3800,
      speaker: "B",
      start: 1800,
      text: "This is the second mock transcription sentence.",
    },
    {
      confidence: 0.96,
      end: 1800,
      speaker: "A",
      start: 0,
      text: "This is the first mock transcription sentence.",
    },
  ] satisfies Omit<TranscriptUtterance, "words">[],
};

const mockStitchAudio = vi.spyOn(tasks, "stitchAudio");
const mockTranscribeAudioWithAssemblyAI = vi.spyOn(
  tasks,
  "transcribeAudioWithAssemblyAI",
);
const mockCleanupOfflineFiles = vi.spyOn(tasks, "cleanupOfflineFiles");

// Make these succeed by default
mockStitchAudio.mockImplementation(async () => {
  return "final-path.m4a";
});
mockTranscribeAudioWithAssemblyAI.mockImplementation(
  vi.fn().mockResolvedValue(FAKE_TRANSCRIPT_OBJECT),
);
mockCleanupOfflineFiles.mockImplementation(
  vi.fn().mockResolvedValue(undefined),
);

describe("tasks", () => {
  describe("/stitch-audio", () => {
    describe("auth", () => {
      test("Should return authorization error if token is not provided", async () => {
        const response = await testServer.inject({
          method: "POST",
          url: "/stitch-audio",
          body: {
            stateCode: "US_NE",
            meetingId: fakeMeeting.id,
          },
        });

        expect(response.statusCode).toBe(401);
        expect(JSON.parse(response.body)).toEqual(
          expect.objectContaining({
            error: "Unauthorized",
            message: "No bearer token was provided",
          }),
        );
      });

      test("Should return authorization error if token is invalid", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: false,
            email:
              "test-service-account-email@test-project.iam.gserviceaccount.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: "/stitch-audio",
          headers: { authorization: `Bearer token` },
          body: {
            stateCode: "US_NE",
            meetingId: fakeMeeting.id,
          },
        });

        expect(response.statusCode).toBe(401);
        expect(JSON.parse(response.body)).toEqual(
          expect.objectContaining({
            error: "Unauthorized",
            message: "Email not verified",
          }),
        );
      });

      test("Should return authorization error if email doesn't match expected", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: true,
            email: "wrong-email@test-project.iam.gserviceaccount.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: "/stitch-audio",
          headers: { authorization: `Bearer token` },
          body: {
            stateCode: "US_NE",
            meetingId: fakeMeeting.id,
          },
        });

        expect(response.statusCode).toBe(403);
        expect(JSON.parse(response.body)).toEqual(
          expect.objectContaining({
            error: "Forbidden",
            message: "Invalid email address",
          }),
        );
      });
    });

    test("Should return 500 if meeting does not exist", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: "Not a meeting",
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: expect.stringContaining(
            "Invalid `prisma.meeting.findUniqueOrThrow()` invocation",
          ),
        }),
      );
    });

    test("Should return 500 and set stitching error if audio stitching fails", async () => {
      mockStitchAudio.mockImplementationOnce(() => {
        throw new Error("Audio stitching failed");
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: "Audio stitching failed",
        }),
      );

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting.postMeetingProcessingStatus).toBe(
        PostMeetingProcessingStatus.STITCHING_ERROR,
      );
    });

    test("Should return 200 and set transcribing error if audio stitching succeeds but queueing transcription fails", async () => {
      mockCloudTasksClient.createTask.mockRejectedValueOnce(new Error());

      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        "Audio stitching completed successfully; queuing transcription failed.",
      );

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting).toEqual(
        expect.objectContaining({
          finalRecordingGCSPath: "final-path.m4a",
          postMeetingProcessingStatus:
            PostMeetingProcessingStatus.TRANSCRIPTION_ERROR,
        }),
      );
    });

    test("Should return 200 and set completed if there is no audio to transcribe", async () => {
      mockStitchAudio.mockImplementationOnce(async () => {
        return null;
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        "No audio files found to stitch; marking meeting as completed.",
      );

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting.postMeetingProcessingStatus).toBe(
        PostMeetingProcessingStatus.COMPLETED,
      );
    });

    test("Should return 200 and set transcribing queued if audio stitching succeeds", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual("Audio stitching completed successfully");

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting).toEqual(
        expect.objectContaining({
          finalRecordingGCSPath: "final-path.m4a",
          postMeetingProcessingStatus:
            PostMeetingProcessingStatus.TRANSCRIPTION_QUEUED,
        }),
      );
    });
  });

  describe("/transcribe-audio", () => {
    beforeEach(async () => {
      // Set the state to what is expected before queueing transcription
      await testPrismaClient.meeting.update({
        where: { id: fakeMeeting.id },
        data: {
          finalRecordingGCSPath: "final-path.m4a",
          postMeetingProcessingStatus:
            PostMeetingProcessingStatus.TRANSCRIPTION_QUEUED,
        },
      });
    });

    test("Should return 500 if meeting does not exist", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/transcribe-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: "Not a meeting",
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: expect.stringContaining(
            "Invalid `prisma.meeting.findUniqueOrThrow()` invocation",
          ),
        }),
      );
    });

    test("Should return 500 and set transcription error if there is no final recording path", async () => {
      await testPrismaClient.meeting.update({
        where: { id: fakeMeeting.id },
        data: { finalRecordingGCSPath: null },
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/transcribe-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: "Final recording GCS path is not set for meeting",
        }),
      );

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting.postMeetingProcessingStatus).toBe(
        PostMeetingProcessingStatus.TRANSCRIPTION_ERROR,
      );
    });

    test("Should return 500 and set transcription error if transcription fails", async () => {
      mockTranscribeAudioWithAssemblyAI.mockImplementationOnce(async () => {
        throw new Error("Transcription failed");
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/transcribe-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: "Transcription failed",
        }),
      );

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting.postMeetingProcessingStatus).toBe(
        PostMeetingProcessingStatus.TRANSCRIPTION_ERROR,
      );
    });

    test("Should return 200 if transcribing succeeds", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/transcribe-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual("Transcription completed successfully");

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
        include: {
          transcriptions: {
            include: { utterances: true },
          },
        },
      });

      expect(meeting).toEqual(
        expect.objectContaining({
          transcriptions: expect.arrayContaining([
            expect.objectContaining({
              provider: TranscriptionProvider.ASSEMBLYAI,
              transcriptObject: FAKE_TRANSCRIPT_OBJECT,
              confidence: 0.95,
              utterances: expect.arrayContaining([
                expect.objectContaining({
                  text: "This is the second mock transcription sentence.",
                  speaker: "B",
                  startTimeMs: 1800,
                  endTimeMs: 3800,
                  confidence: 0.98,
                }),
                expect.objectContaining({
                  text: "This is the first mock transcription sentence.",
                  speaker: "A",
                  startTimeMs: 0,
                  endTimeMs: 1800,
                  confidence: 0.96,
                }),
              ]),
            }),
          ]),
          postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
        }),
      );
    });

    test("Should call cleanupOfflineFiles after successful transcription", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/transcribe-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockCleanupOfflineFiles).toHaveBeenCalledWith(fakeMeeting.id);
    });

    test("Should not call cleanupOfflineFiles if transcription fails", async () => {
      mockTranscribeAudioWithAssemblyAI.mockImplementationOnce(async () => {
        throw new Error("Transcription failed");
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/transcribe-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(mockCleanupOfflineFiles).not.toHaveBeenCalled();
    });
  });

  describe("/upload-audio (offline mode)", () => {
    const originalOfflineMode = env.IS_OFFLINE;
    const originalOfflineStorageDir = env.OFFLINE_STORAGE_DIR;
    const testStorageDir = "/tmp/test-offline-upload-storage";

    beforeEach(() => {
      // Enable offline mode for these tests
      env.IS_OFFLINE = true;
      env.OFFLINE_STORAGE_DIR = testStorageDir;

      // Create test storage directory
      if (!require("fs").existsSync(testStorageDir)) {
        require("fs").mkdirSync(testStorageDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Restore original env vars
      env.IS_OFFLINE = originalOfflineMode;
      env.OFFLINE_STORAGE_DIR = originalOfflineStorageDir;

      // Clean up test storage directory
      if (require("fs").existsSync(testStorageDir)) {
        require("fs").rmSync(testStorageDir, { recursive: true, force: true });
      }
    });

    test("Should return 400 if offline mode is not enabled", async () => {
      env.IS_OFFLINE = false;

      const response = await testServer.inject({
        method: "PUT",
        url: "/upload-audio/test-meeting/test-file.m4a",
        payload: Buffer.from("test audio data"),
        headers: {
          "content-type": "audio/m4a",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toContain(
        "Uploading to server is only valid when running in offline mode",
      );
    });

    test("Should successfully upload audio file", async () => {
      const meetingId = "test-meeting-123";
      const filename = "1234567890.m4a";
      const audioData = Buffer.from("test audio data");

      const response = await testServer.inject({
        method: "PUT",
        url: `/upload-audio/${meetingId}/${filename}`,
        payload: audioData,
        headers: {
          "content-type": "audio/m4a",
        },
      });

      console.log(response);
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("File uploaded successfully");

      // Verify file was saved
      const fs = require("fs");
      const path = require("path");
      const savedFilePath = path.join(testStorageDir, meetingId, filename);
      expect(fs.existsSync(savedFilePath)).toBe(true);

      const savedData = fs.readFileSync(savedFilePath);
      expect(savedData.toString()).toBe("test audio data");
    });

    test("Should create meeting directory if it doesn't exist", async () => {
      const meetingId = "new-meeting-456";
      const filename = "1234567890.m4a";
      const audioData = Buffer.from("test audio data");

      const response = await testServer.inject({
        method: "PUT",
        url: `/upload-audio/${meetingId}/${filename}`,
        payload: audioData,
        headers: {
          "content-type": "audio/m4a",
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify directory was created
      const fs = require("fs");
      const path = require("path");
      const meetingDir = path.join(testStorageDir, meetingId);
      expect(fs.existsSync(meetingDir)).toBe(true);
    });

    test("Should handle multiple file uploads to same meeting", async () => {
      const meetingId = "multi-file-meeting";
      const files = [
        { name: "1000.m4a", data: "audio segment 1" },
        { name: "2000.m4a", data: "audio segment 2" },
        { name: "3000.m4a", data: "audio segment 3" },
      ];

      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        const response = await testServer.inject({
          method: "PUT",
          url: `/upload-audio/${meetingId}/${file.name}`,
          payload: Buffer.from(file.data),
          headers: {
            "content-type": "audio/m4a",
          },
        });

        expect(response.statusCode).toBe(200);
      }

      // Verify all files were saved
      const fs = require("fs");
      const path = require("path");
      const meetingDir = path.join(testStorageDir, meetingId);
      const savedFiles = fs.readdirSync(meetingDir);

      expect(savedFiles).toHaveLength(3);
      expect(savedFiles).toContain("1000.m4a");
      expect(savedFiles).toContain("2000.m4a");
      expect(savedFiles).toContain("3000.m4a");
    });

    test("Should accept different audio content types", async () => {
      const meetingId = "content-type-test";
      const contentTypes = ["audio/m4a", "audio/x-m4a", "audio/mp4"];

      for (const contentType of contentTypes) {
        // eslint-disable-next-line no-await-in-loop
        const response = await testServer.inject({
          method: "PUT",
          url: `/upload-audio/${meetingId}/test-${contentType.replace("/", "-")}.m4a`,
          payload: Buffer.from("test data"),
          headers: {
            "content-type": contentType,
          },
        });

        expect(response.statusCode).toBe(200);
      }
    });
  });
});
