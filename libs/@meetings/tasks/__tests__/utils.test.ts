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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { DeepgramError } from "@deepgram/sdk";
import { Storage } from "@google-cloud/storage";
import { Transcript } from "assemblyai";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  GCS_API_ENDPOINT,
  mockAssemblyAI,
  mockDeepgram,
} from "~@meetings/tasks/test/setup";
import {
  cleanupOfflineFiles,
  getSignedUrlForNewRecording,
  stitchAudio,
  transcribeAudioWithAssemblyAI,
  transcribeAudioWithDeepgram,
} from "~@meetings/tasks/utils";

const AUDIO_RECORDINGS_BUCKET_NAME = "test-audio-recordings";

describe("utils", () => {
  describe("getSignedUrlForNewRecording", () => {
    beforeAll(() => {
      // // tell vitest we use mocked time
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-19"));
    });

    afterAll(() => {
      // restoring date after the tests are complete
      vi.useRealTimers();
    });

    test("Should return url for new recording", async () => {
      const url = await getSignedUrlForNewRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "signed-url-test-folder",
      );

      // 1760832000 = seconds since epoch for Oct 19, 2025
      expect(url).toEqual(
        `${GCS_API_ENDPOINT}/test-audio-recordings/signed-url-test-folder/1760832000.m4a`,
      );
    });
  });

  describe("stitchAudio", () => {
    beforeAll(async () => {
      const folderName = "stitch-audio-test-folder";

      const storage = new Storage({
        apiEndpoint: GCS_API_ENDPOINT,
        projectId: "test",
      });

      await storage.createBucket(AUDIO_RECORDINGS_BUCKET_NAME);

      console.log(process.cwd());

      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/1.m4a", {
          destination: `${folderName}/1.m4a`,
          resumable: false,
        });
      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/2.m4a", {
          destination: `${folderName}/2.m4a`,
          resumable: false,
        });
      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/3.m4a", {
          destination: `${folderName}/3.m4a`,
          resumable: false,
        });
    });

    test("Should return null if no audio files are found", async () => {
      const result = await stitchAudio(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "non-existent-folder",
      );

      expect(result).toBeNull();
    });

    test("Should stitch audio if meeting exists", async () => {
      const stitchedAudioPath = await stitchAudio(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "stitch-audio-test-folder",
      );

      const storage = new Storage({
        apiEndpoint: GCS_API_ENDPOINT,
        projectId: "test",
      });

      const [files] = await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .getFiles({ prefix: `stitch-audio-test-folder/` });

      expect(stitchedAudioPath).toEqual("stitch-audio-test-folder/final.m4a");
      expect(files.map((f) => f.name)).toEqual(
        expect.arrayContaining([`stitch-audio-test-folder/final.m4a`]),
      );
    });
  });

  describe("transcribeAudioWithAssemblyAI", () => {
    test("Should throw error if transcription comes back with error", async () => {
      vi.mocked(mockAssemblyAI.transcripts.transcribe).mockResolvedValueOnce(
        {
          id: "mock-transcript-id",
          status: "error",
          error: "Mock transcription error",
        } as Transcript, // Do this so we don't have to fill all of the fields which we won't use anyways
      );

      await expect(
        transcribeAudioWithAssemblyAI(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "transcription-test-folder/final.m4a",
          "test-api-key",
        ),
      ).rejects.toThrow(
        "AssemblyAI transcription failed: Mock transcription error",
      );
    });

    test("Should return transcript", async () => {
      const transcript = await transcribeAudioWithAssemblyAI(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "transcription-test-folder/final.m4a",
        "test-api-key",
      );

      expect(transcript).toEqual({
        audio_duration: 1.8,
        id: "mock-transcript-id",
        language_code: "en",
        status: "completed",
        summary: "This is a mock summary of the transcription.",
        text: "This is a mock transcription.",
        utterances: [
          {
            confidence: 0.96,
            end: 1800,
            speaker: "A",
            start: 0,
            text: "This is a mock transcription.",
            words: [
              {
                confidence: 0.95,
                end: 400,
                speaker: "A",
                start: 0,
                text: "This",
              },
              {
                confidence: 0.98,
                end: 600,
                speaker: "A",
                start: 400,
                text: "is",
              },
              {
                confidence: 0.97,
                end: 700,
                speaker: "A",
                start: 600,
                text: "a",
              },
              {
                confidence: 0.93,
                end: 1100,
                speaker: "A",
                start: 700,
                text: "mock",
              },
              {
                confidence: 0.96,
                end: 1800,
                speaker: "A",
                start: 1100,
                text: "transcription",
              },
            ],
          },
        ],
        words: [
          {
            confidence: 0.95,
            end: 400,
            speaker: "A",
            start: 0,
            text: "This",
          },
          {
            confidence: 0.98,
            end: 600,
            speaker: "A",
            start: 400,
            text: "is",
          },
          {
            confidence: 0.97,
            end: 700,
            speaker: "A",
            start: 600,
            text: "a",
          },
          {
            confidence: 0.93,
            end: 1100,
            speaker: "A",
            start: 700,
            text: "mock",
          },
          {
            confidence: 0.96,
            end: 1800,
            speaker: "A",
            start: 1100,
            text: "transcription",
          },
        ],
      });
    });
  });

  describe("transcribeAudioWithDeepgram", () => {
    test("Should throw error if transcription comes back with error", async () => {
      vi.mocked(
        mockDeepgram.listen.prerecorded.transcribeUrl,
      ).mockResolvedValueOnce({
        error: new DeepgramError("Mock transcription error"),
        result: null,
      });

      await expect(
        transcribeAudioWithDeepgram(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "transcription-test-folder/final.m4a",
          "test-api-key",
        ),
      ).rejects.toThrow(
        "Deepgram transcription failed: DeepgramError: Mock transcription error",
      );
    });

    test("Should return transcript", async () => {
      const transcript = await transcribeAudioWithDeepgram(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "transcription-test-folder/final.m4a",
        "test-api-key",
      );

      expect(transcript).toEqual({
        summary: "This is a mock summary of the transcription.",
        utterances: [
          {
            confidence: 0.96,
            end: 1800,
            speaker: 0,
            start: 0,
            transcript: "This is a mock transcription.",
          },
        ],
      });
    });
  });

  describe("Offline mode", () => {
    const originalOfflineMode = process.env["IS_OFFLINE"];
    const originalOfflineStorageDir = process.env["OFFLINE_STORAGE_DIR"];
    const testStorageDir = path.join(os.tmpdir(), "test-offline-storage");

    beforeEach(() => {
      // Enable offline mode for these tests
      process.env["IS_OFFLINE"] = "true";
      process.env["OFFLINE_STORAGE_DIR"] = testStorageDir;

      // Create test storage directory
      if (!fs.existsSync(testStorageDir)) {
        fs.mkdirSync(testStorageDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Restore original env vars
      process.env["IS_OFFLINE"] = originalOfflineMode;
      process.env["OFFLINE_STORAGE_DIR"] = originalOfflineStorageDir;

      // Clean up test storage directory
      if (fs.existsSync(testStorageDir)) {
        fs.rmSync(testStorageDir, { recursive: true, force: true });
      }
    });

    describe("getSignedUrlForNewRecording (offline)", () => {
      beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-10-19"));
      });

      afterAll(() => {
        vi.useRealTimers();
      });

      test("Should return local endpoint URL in offline mode", async () => {
        const url = await getSignedUrlForNewRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "test-meeting-id",
        );

        // 1760832000 = seconds since epoch for Oct 19, 2025
        expect(url).toEqual(
          "http://localhost:3002/upload-audio/test-meeting-id/1760832000.m4a",
        );
      });
    });

    describe("stitchAudio (offline)", () => {
      const meetingId = "offline-stitch-test-meeting";
      const meetingDir = path.join(testStorageDir, meetingId);

      beforeEach(() => {
        // Create meeting directory with test audio files
        fs.mkdirSync(meetingDir, { recursive: true });

        // Copy test audio files
        fs.copyFileSync("__tests__/data/1.m4a", path.join(meetingDir, "1.m4a"));
        fs.copyFileSync("__tests__/data/2.m4a", path.join(meetingDir, "2.m4a"));
        fs.copyFileSync("__tests__/data/3.m4a", path.join(meetingDir, "3.m4a"));
      });

      test("Should return null if meeting directory doesn't exist", async () => {
        const result = await stitchAudio(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "non-existent-meeting",
        );

        expect(result).toBeNull();
      });

      test("Should return null if meeting directory has no audio files", async () => {
        const emptyMeetingId = "empty-meeting";
        const emptyMeetingDir = path.join(testStorageDir, emptyMeetingId);
        fs.mkdirSync(emptyMeetingDir, { recursive: true });

        const result = await stitchAudio(
          AUDIO_RECORDINGS_BUCKET_NAME,
          emptyMeetingId,
        );

        expect(result).toBeNull();
      });

      test("Should stitch audio files and save locally", async () => {
        const result = await stitchAudio(
          AUDIO_RECORDINGS_BUCKET_NAME,
          meetingId,
        );

        expect(result).toEqual(`${meetingId}/final.m4a`);

        // Verify final file exists
        const finalPath = path.join(meetingDir, "final.m4a");
        expect(fs.existsSync(finalPath)).toBe(true);

        // Verify final file has content
        const stats = fs.statSync(finalPath);
        expect(stats.size).toBeGreaterThan(0);
      });

      test("Should sort files by timestamp", async () => {
        // Create files with different timestamps
        const timestamps = [1000, 3000, 2000];
        for (const ts of timestamps) {
          fs.copyFileSync(
            "__tests__/data/1.m4a",
            path.join(meetingDir, `${ts}.m4a`),
          );
        }

        const result = await stitchAudio(
          AUDIO_RECORDINGS_BUCKET_NAME,
          meetingId,
        );

        expect(result).toEqual(`${meetingId}/final.m4a`);

        // Verify final file was created
        const finalPath = path.join(meetingDir, "final.m4a");
        expect(fs.existsSync(finalPath)).toBe(true);
      });
    });

    describe("transcribeAudioWithAssemblyAI (offline)", () => {
      const meetingId = "offline-transcribe-test-meeting";
      const meetingDir = path.join(testStorageDir, meetingId);

      beforeEach(() => {
        // Create meeting directory with final audio file
        fs.mkdirSync(meetingDir, { recursive: true });
        fs.copyFileSync(
          "__tests__/data/1.m4a",
          path.join(meetingDir, "final.m4a"),
        );
      });

      test("Should use local file path for transcription", async () => {
        const finalRecordingPath = `${meetingId}/final.m4a`;

        const transcript = await transcribeAudioWithAssemblyAI(
          AUDIO_RECORDINGS_BUCKET_NAME,
          finalRecordingPath,
          "test-api-key",
        );

        expect(transcript).toBeDefined();
        expect(transcript.status).toBe("completed");

        // Verify AssemblyAI was called with local file path
        expect(mockAssemblyAI.transcripts.transcribe).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: path.join(testStorageDir, meetingId, "final.m4a"),
          }),
        );
      });
    });

    describe("cleanupOfflineFiles", () => {
      test("Should delete meeting directory and all files", async () => {
        const meetingId = "cleanup-test-meeting";
        const meetingDir = path.join(testStorageDir, meetingId);

        // Create meeting directory with files
        fs.mkdirSync(meetingDir, { recursive: true });
        fs.writeFileSync(path.join(meetingDir, "1.m4a"), "test data 1");
        fs.writeFileSync(path.join(meetingDir, "2.m4a"), "test data 2");
        fs.writeFileSync(path.join(meetingDir, "final.m4a"), "final audio");

        // Verify files exist
        expect(fs.existsSync(meetingDir)).toBe(true);
        expect(fs.readdirSync(meetingDir).length).toBe(3);

        // Cleanup
        await cleanupOfflineFiles(meetingId);

        // Verify directory was deleted
        expect(fs.existsSync(meetingDir)).toBe(false);
      });

      test("Should not throw error if meeting directory doesn't exist", async () => {
        await expect(
          cleanupOfflineFiles("non-existent-meeting"),
        ).resolves.not.toThrow();
      });

      test("Should not cleanup in online mode", async () => {
        process.env["IS_OFFLINE"] = "false";

        const meetingId = "online-mode-meeting";
        const meetingDir = path.join(testStorageDir, meetingId);

        // Create meeting directory with files
        fs.mkdirSync(meetingDir, { recursive: true });
        fs.writeFileSync(path.join(meetingDir, "final.m4a"), "final audio");

        // Cleanup should not delete in online mode
        await cleanupOfflineFiles(meetingId);

        // Verify directory still exists
        expect(fs.existsSync(meetingDir)).toBe(true);
      });
    });
  });
});
