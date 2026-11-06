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
import ffmpeg from "fluent-ffmpeg";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AUDIO_FORMATS } from "~@meetings/config";

vi.spyOn(ffmpeg, "ffprobe").mockImplementation(
  // @ts-expect-error - mock doesn't need full signature
  (_filePath: string, cb: (err: Error | null, metadata: unknown) => void) => {
    cb(null, { format: { duration: 1.5 } });
  },
);

import {
  GCS_API_ENDPOINT,
  mockAssemblyAI,
  mockDeepgram,
} from "~@meetings/tasks/test/setup";
import {
  cleanupStaleLocalFiles,
  findUploadedRecording,
  getSignedUrlForNewRecording,
  getSignedUrlForRecording,
  transcribeAudioWithAssemblyAI,
  transcribeAudioWithDeepgram,
} from "~@meetings/tasks/utils";

const AUDIO_RECORDINGS_BUCKET_NAME = "test-audio-recordings";
const FIXTURE_SIZE_BYTES = fs.statSync("__tests__/data/1.m4a").size;

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

    test("Should return url for new recording with m4a format", async () => {
      const url = await getSignedUrlForNewRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "signed-url-test-folder",
        AUDIO_FORMATS.m4a.extension,
        AUDIO_FORMATS.m4a.contentType,
      );

      // 1760832000 = seconds since epoch for Oct 19, 2025
      expect(url).toEqual(
        `${GCS_API_ENDPOINT}/test-audio-recordings/signed-url-test-folder/1760832000.m4a`,
      );
    });

    test("Should return url for new recording with webm format", async () => {
      const url = await getSignedUrlForNewRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "signed-url-test-folder-web",
        AUDIO_FORMATS.webm.extension,
        AUDIO_FORMATS.webm.contentType,
      );

      // 1760832000 = seconds since epoch for Oct 19, 2025
      expect(url).toEqual(
        `${GCS_API_ENDPOINT}/test-audio-recordings/signed-url-test-folder-web/1760832000.webm`,
      );
    });
  });

  describe("findUploadedRecording", () => {
    const storage = new Storage({
      apiEndpoint: GCS_API_ENDPOINT,
      projectId: "test",
    });

    const uploadFixture = (destination: string) =>
      storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/1.m4a", { destination, resumable: false });

    beforeAll(async () => {
      await storage.createBucket(AUDIO_RECORDINGS_BUCKET_NAME);

      await uploadFixture("single-recording-folder/1760832000.m4a");
      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .file("single-recording-folder/label-studio-task.json")
        .save("{}", { resumable: false });

      // 999999999 sorts after 1760832000 as a string but is the older upload
      await uploadFixture("multiple-recordings-folder/1760832000.m4a");
      await uploadFixture("multiple-recordings-folder/999999999.m4a");
    });

    test("Should return null if no audio files are found", async () => {
      const result = await findUploadedRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "non-existent-folder",
      );

      expect(result).toBeNull();
    });

    test("Should return the recording and its duration, ignoring non-audio files", async () => {
      const result = await findUploadedRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "single-recording-folder",
      );

      expect(result).toEqual({
        filePath: "single-recording-folder/1760832000.m4a",
        durationMs: 1500,
        uploadedFiles: [
          {
            fileName: "single-recording-folder/1760832000.m4a",
            sizeBytes: FIXTURE_SIZE_BYTES,
          },
        ],
      });
    });

    test("Should return the newest recording if the folder holds more than one", async () => {
      const result = await findUploadedRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "multiple-recordings-folder",
      );

      expect(result).toEqual({
        filePath: "multiple-recordings-folder/1760832000.m4a",
        durationMs: 1500,
        uploadedFiles: expect.arrayContaining([
          {
            fileName: "multiple-recordings-folder/1760832000.m4a",
            sizeBytes: FIXTURE_SIZE_BYTES,
          },
          {
            fileName: "multiple-recordings-folder/999999999.m4a",
            sizeBytes: FIXTURE_SIZE_BYTES,
          },
        ]),
      });
    });

    // /tmp is tmpfs on Cloud Run, so a leaked download holds the container's
    // memory until the instance recycles.
    test("Should remove its temp directory after probing", async () => {
      const mkdtempSpy = vi.spyOn(fs, "mkdtempSync");

      try {
        await findUploadedRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "single-recording-folder",
        );

        const tempDir = mkdtempSpy.mock.results[0]?.value;
        expect(tempDir).toMatch(/recording-/);
        expect(fs.existsSync(tempDir)).toBe(false);
      } finally {
        mkdtempSpy.mockRestore();
      }
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

      const request = vi.mocked(mockAssemblyAI.transcripts.transcribe).mock
        .calls[0]?.[0];
      expect(request).not.toHaveProperty("summarization");
      expect(request).not.toHaveProperty("summary_model");
      expect(request).not.toHaveProperty("summary_type");

      expect(transcript).toEqual({
        audio_duration: 1.8,
        id: "mock-transcript-id",
        language_code: "en",
        status: "completed",
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

  describe("Local mode", () => {
    const originalLocalMode = process.env["IS_LOCAL_MODE"];
    const originalLocalStorageDir = process.env["LOCAL_STORAGE_DIR"];
    const testStorageDir = path.join(os.tmpdir(), "test-local-storage");

    beforeEach(() => {
      // Enable local mode for these tests
      process.env["IS_LOCAL_MODE"] = "true";
      process.env["LOCAL_STORAGE_DIR"] = testStorageDir;

      // Create test storage directory
      if (!fs.existsSync(testStorageDir)) {
        fs.mkdirSync(testStorageDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Restore original env vars
      process.env["IS_LOCAL_MODE"] = originalLocalMode;
      process.env["LOCAL_STORAGE_DIR"] = originalLocalStorageDir;

      // Clean up test storage directory
      if (fs.existsSync(testStorageDir)) {
        fs.rmSync(testStorageDir, { recursive: true, force: true });
      }
    });

    describe("getSignedUrlForNewRecording (local mode)", () => {
      beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-10-19"));
      });

      afterAll(() => {
        vi.useRealTimers();
      });

      test("Should return local endpoint URL in local mode with m4a", async () => {
        const url = await getSignedUrlForNewRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "test-meeting-id",
          AUDIO_FORMATS.m4a.extension,
          AUDIO_FORMATS.m4a.contentType,
        );

        // 1760832000 = seconds since epoch for Oct 19, 2025
        expect(url).toEqual(
          "http://localhost:3002/upload-audio/test-meeting-id/1760832000.m4a",
        );
      });

      test("Should return local endpoint URL in local mode with webm", async () => {
        const url = await getSignedUrlForNewRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "test-meeting-id-web",
          AUDIO_FORMATS.webm.extension,
          AUDIO_FORMATS.webm.contentType,
        );

        // 1760832000 = seconds since epoch for Oct 19, 2025
        expect(url).toEqual(
          "http://localhost:3002/upload-audio/test-meeting-id-web/1760832000.webm",
        );
      });
    });

    describe("findUploadedRecording (local mode)", () => {
      const meetingId = "local-recording-test-meeting";
      const meetingDir = path.join(testStorageDir, meetingId);

      beforeEach(() => {
        fs.mkdirSync(meetingDir, { recursive: true });
        fs.copyFileSync(
          "__tests__/data/1.m4a",
          path.join(meetingDir, "1760832000.m4a"),
        );
      });

      test("Should return null if meeting directory doesn't exist", async () => {
        const result = await findUploadedRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          "non-existent-meeting",
        );

        expect(result).toBeNull();
      });

      test("Should return null if meeting directory has no audio files", async () => {
        const emptyMeetingId = "empty-meeting";
        const emptyMeetingDir = path.join(testStorageDir, emptyMeetingId);
        fs.mkdirSync(emptyMeetingDir, { recursive: true });

        const result = await findUploadedRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          emptyMeetingId,
        );

        expect(result).toBeNull();
      });

      test("Should return the recording and its duration", async () => {
        const result = await findUploadedRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          meetingId,
        );

        expect(result).toEqual({
          filePath: `${meetingId}/1760832000.m4a`,
          durationMs: 1500,
          uploadedFiles: [
            {
              fileName: `${meetingId}/1760832000.m4a`,
              sizeBytes: FIXTURE_SIZE_BYTES,
            },
          ],
        });
      });

      test("Should return the newest recording if the directory holds more than one", async () => {
        // 999999999 sorts after 1760832000 as a string but is the older upload
        fs.copyFileSync(
          "__tests__/data/1.m4a",
          path.join(meetingDir, "999999999.m4a"),
        );

        const result = await findUploadedRecording(
          AUDIO_RECORDINGS_BUCKET_NAME,
          meetingId,
        );

        expect(result).toEqual({
          filePath: `${meetingId}/1760832000.m4a`,
          durationMs: 1500,
          uploadedFiles: expect.arrayContaining([
            {
              fileName: `${meetingId}/999999999.m4a`,
              sizeBytes: FIXTURE_SIZE_BYTES,
            },
          ]),
        });
      });
    });

    describe("transcribeAudioWithAssemblyAI (local mode)", () => {
      const meetingDir = "US_DEMO/local-transcribe-test-meeting";
      const localMeetingDir = path.join(testStorageDir, meetingDir);

      beforeEach(() => {
        // Create meeting directory with final audio file
        fs.mkdirSync(localMeetingDir, { recursive: true });
        fs.copyFileSync(
          "__tests__/data/1.m4a",
          path.join(localMeetingDir, "final.m4a"),
        );
      });

      test("Should use local file path for transcription", async () => {
        const finalRecordingPath = `${meetingDir}/final.m4a`;

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
            audio: path.join(testStorageDir, meetingDir, "final.m4a"),
          }),
        );
      });
    });

    describe("getSignedUrlForRecording (local mode)", () => {
      const folderName = "US_TN/playback-test-meeting";

      test("Should return local stream URL when the file exists", async () => {
        const meetingDir = path.join(testStorageDir, folderName);
        fs.mkdirSync(meetingDir, { recursive: true });
        fs.writeFileSync(path.join(meetingDir, "final.m4a"), "final audio");

        const url = await getSignedUrlForRecording(
          folderName,
          AUDIO_RECORDINGS_BUCKET_NAME,
          "final.m4a",
          "192.168.1.10:3002",
        );

        expect(url).toEqual(
          `http://192.168.1.10:3002/stream-audio/${folderName}/final.m4a`,
        );
      });

      test("Should return null when the file is missing", async () => {
        const url = await getSignedUrlForRecording(
          folderName,
          AUDIO_RECORDINGS_BUCKET_NAME,
          "final.m4a",
        );

        expect(url).toBeNull();
      });
    });

    describe("cleanupStaleLocalFiles", () => {
      const createMeetingDir = (
        stateCode: string,
        meetingId: string,
        ageDays: number,
      ) => {
        const meetingDir = path.join(testStorageDir, stateCode, meetingId);
        fs.mkdirSync(meetingDir, { recursive: true });
        fs.writeFileSync(path.join(meetingDir, "final.m4a"), "final audio");
        const mtime = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
        fs.utimesSync(meetingDir, mtime, mtime);
        return meetingDir;
      };

      test("Should delete meeting directories older than the max age", () => {
        const staleDir = createMeetingDir("US_TN", "stale-meeting", 8);
        const otherStateStaleDir = createMeetingDir("US_NE", "stale", 30);
        const recentDir = createMeetingDir("US_TN", "recent-meeting", 1);

        cleanupStaleLocalFiles(7);

        expect(fs.existsSync(staleDir)).toBe(false);
        expect(fs.existsSync(otherStateStaleDir)).toBe(false);
        expect(fs.existsSync(recentDir)).toBe(true);
      });

      test("Should not throw if the storage directory doesn't exist", () => {
        fs.rmSync(testStorageDir, { recursive: true, force: true });

        expect(() => cleanupStaleLocalFiles(7)).not.toThrow();
      });

      test("Should not cleanup in GCS mode", () => {
        process.env["IS_LOCAL_MODE"] = "false";
        const staleDir = createMeetingDir("US_TN", "gcs-mode-meeting", 30);

        cleanupStaleLocalFiles(7);

        expect(fs.existsSync(staleDir)).toBe(true);
      });
    });
  });
});
