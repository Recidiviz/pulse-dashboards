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

import { subDays } from "date-fns";
import { describe, expect, test, vi } from "vitest";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import { TranscriptionProvider } from "~@meetings/prisma/client";
import {
  cleanupMeetingData,
  cleanupStateData,
} from "~@meetings/server/jobs/meeting-artifact-cleanup";
import { testPrismaClient } from "~@meetings/server/test/setup";
import { fakeClient, fakeStaff } from "~@meetings/server/test/setup/seed";

const mockGetPrismaClientForStateCode = vi.hoisted(() => vi.fn());

vi.mock("~@meetings/prisma", () => ({
  getPrismaClientForStateCode: mockGetPrismaClientForStateCode,
}));

const mockGetFiles = vi.fn();
const mockListedFileDelete = vi.fn().mockResolvedValue(undefined);
const mockFileDelete = vi.fn().mockResolvedValue(undefined);
const mockFileExists = vi.fn().mockResolvedValue([false]);
const mockFileDownload = vi.fn();
const mockFileSave = vi.fn().mockResolvedValue(undefined);

function fakeListedFile(name: string) {
  return { name, delete: mockListedFileDelete };
}

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => ({
    bucket: vi.fn().mockReturnValue({
      getFiles: mockGetFiles,
      file: vi.fn().mockReturnValue({
        delete: mockFileDelete,
        exists: mockFileExists,
        download: mockFileDownload,
        save: mockFileSave,
      }),
    }),
  })),
}));

const AUDIO_TTL_DAYS = 30;
const TRANSCRIPT_TTL_DAYS = 30;
const STATE_CODE = "US_NE";

function daysAgoMs(days: number) {
  return subDays(new Date(), days).getTime();
}

async function createExpiredMeeting(
  id: string,
  daysAgo: number,
  overrides: Record<string, unknown> = {},
) {
  const endTime = new Date(daysAgoMs(daysAgo));
  return testPrismaClient.meeting.create({
    data: {
      id,
      staffEmail: fakeStaff.email,
      client: { connect: { personId: fakeClient.personId } },
      startTime: new Date(endTime.getTime() - 60 * 60 * 1000),
      endTime,
      recordingsGCSBucket: "test-bucket",
      recordingsFolderPath: `meetings/${id}`,
      ...overrides,
    },
  });
}

// Return the test Prisma client for US_NE; throw for any other state to
// simulate a missing DATABASE_URL (the common real-world failure mode).
beforeEach(() => {
  mockGetPrismaClientForStateCode.mockImplementation((stateCode: string) => {
    if (stateCode === STATE_CODE) return testPrismaClient;
    throw new Error(`No database configured for state ${stateCode}`);
  });
});

describe("cleanupStateData", () => {
  beforeEach(() => {
    // Default: bucket has 2 audio chunks
    mockGetFiles.mockResolvedValue([
      [fakeListedFile("chunk-1.m4a"), fakeListedFile("chunk-2.m4a")],
    ]);
  });

  test("returns zero stats when there are no expired meetings", async () => {
    // Only the seeded fakeMeeting exists (endTime is null — won't be selected)
    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats).toEqual({
      meetingsProcessed: 0,
      meetingsSkipped: 0,
      gcsFilesDeleted: 0,
      transcriptionsDeleted: 0,
      errors: [],
    });
    expect(mockListedFileDelete).not.toHaveBeenCalled();
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test("skips meetings where both transcriptDeletedAt and audioDeletedAt are already set", async () => {
    await createExpiredMeeting("already-cleaned-meeting", 60, {
      transcriptDeletedAt: new Date(),
      audioDeletedAt: new Date(),
    });

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.meetingsProcessed).toBe(0);
    expect(mockListedFileDelete).not.toHaveBeenCalled();
  });

  test("only cleans transcripts when audioDeletedAt is already set", async () => {
    const meeting = await createExpiredMeeting("partial-cleaned-meeting", 60, {
      audioDeletedAt: new Date(),
    });
    await testPrismaClient.transcription.create({
      data: {
        meetingId: meeting.id,
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
      },
    });

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.meetingsProcessed).toBe(1);
    expect(stats.gcsFilesDeleted).toBe(0); // audio already cleaned, GCS not touched
    expect(stats.transcriptionsDeleted).toBe(1);
    expect(mockListedFileDelete).not.toHaveBeenCalled();
  });

  test("does not clean up meetings within the TTL window", async () => {
    await createExpiredMeeting("recent-meeting", 5); // 5 days ago, within 30-day TTL

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.meetingsProcessed).toBe(0);
    expect(mockListedFileDelete).not.toHaveBeenCalled();
  });

  test("deletes audio files in the recordings folder for expired meetings", async () => {
    await createExpiredMeeting("expired-meeting", 60);

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.meetingsProcessed).toBe(1);
    expect(stats.gcsFilesDeleted).toBe(2);
    expect(mockListedFileDelete).toHaveBeenCalledTimes(2);
  });

  test("preserves the label-studio-task.json file when deleting audio", async () => {
    mockGetFiles.mockResolvedValueOnce([
      [
        fakeListedFile("meetings/keep-json/chunk-1.m4a"),
        fakeListedFile("meetings/keep-json/chunk-2.m4a"),
        fakeListedFile("meetings/keep-json/label-studio-task.json"),
      ],
    ]);
    await createExpiredMeeting("keep-json", 60, {
      recordingsFolderPath: "meetings/keep-json",
    });

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      // Disable transcript cleanup so the JSON isn't scrubbed/touched here.
      null,
      false,
    );

    expect(stats.gcsFilesDeleted).toBe(2);
    expect(mockListedFileDelete).toHaveBeenCalledTimes(2);
    expect(mockFileSave).not.toHaveBeenCalled();
  });

  test("deletes the final stitched recording file when present", async () => {
    await createExpiredMeeting("expired-with-final", 60, {
      finalRecordingGCSPath: "final/expired-with-final.m4a",
    });

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.meetingsProcessed).toBe(1);
    expect(mockFileDelete).toHaveBeenCalled();
    // 1 final file + 2 folder files
    expect(stats.gcsFilesDeleted).toBe(3);
  });

  test("deletes transcriptions and utterances from the database", async () => {
    const meeting = await createExpiredMeeting(
      "expired-with-transcription",
      60,
    );
    await testPrismaClient.transcription.create({
      data: {
        meetingId: meeting.id,
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
        utterances: {
          create: [
            {
              speaker: "A",
              text: "Hello",
              startTimeMs: 0,
              endTimeMs: 1000,
              confidence: 0.9,
            },
          ],
        },
      },
    });

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.transcriptionsDeleted).toBe(1);

    const remaining = await testPrismaClient.transcription.findMany({
      where: { meetingId: meeting.id },
    });
    expect(remaining).toHaveLength(0);
  });

  test("scrubs transcript fields from Label Studio task JSON when cleaning transcripts", async () => {
    const meeting = await createExpiredMeeting("expired-scrub-ls", 60);
    await testPrismaClient.transcription.create({
      data: {
        meetingId: meeting.id,
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
      },
    });

    const originalTask = {
      audio: "gs://test-bucket/meetings/expired-scrub-ls/final.m4a",
      transcript_assemblyai: "[A]: Hello",
      transcript_deepgram: "[0]: Hello",
      transcript_best_provider: "assemblyai",
      transcript_best_confidence: 0.95,
      case_note: "Some notes",
      meta: { "Meeting ID": meeting.id },
    };
    mockFileExists.mockResolvedValueOnce([true]);
    mockFileDownload.mockResolvedValueOnce([
      Buffer.from(JSON.stringify(originalTask)),
    ]);

    await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(mockFileSave).toHaveBeenCalled();
    const savedJson = JSON.parse(mockFileSave.mock.calls[0][0]);
    expect(savedJson.transcript_assemblyai).toBeNull();
    expect(savedJson.transcript_deepgram).toBeNull();
    expect(savedJson.transcript_best_provider).toBeNull();
    expect(savedJson.transcript_best_confidence).toBeNull();
    // Non-transcript fields should be preserved
    expect(savedJson.case_note).toBe("Some notes");
    expect(savedJson.audio).toBe(
      "gs://test-bucket/meetings/expired-scrub-ls/final.m4a",
    );
  });

  test("sets audioDeletedAt, transcriptDeletedAt, and clears finalRecordingGCSPath after cleanup", async () => {
    await createExpiredMeeting("expired-clear-fields", 60, {
      finalRecordingGCSPath: "final/recording.m4a",
    });

    await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
      where: { id: "expired-clear-fields" },
    });
    expect(meeting.finalRecordingGCSPath).toBeNull();
    expect(meeting.audioDeletedAt).not.toBeNull();
    expect(meeting.transcriptDeletedAt).not.toBeNull();
  });

  test("processes multiple expired meetings", async () => {
    await createExpiredMeeting("expired-1", 60);
    await createExpiredMeeting("expired-2", 60);
    await createExpiredMeeting("expired-3", 60);

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.meetingsProcessed).toBe(3);
    expect(stats.gcsFilesDeleted).toBe(6); // 2 files per meeting
  });

  describe("independent TTL cleanup", () => {
    test("cleans audio but not transcripts when only audioTTLDays has elapsed", async () => {
      // 45 days old: past audio TTL (30) but within transcript TTL (90)
      const meeting = await createExpiredMeeting("audio-ttl-only", 45);
      await testPrismaClient.transcription.create({
        data: {
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.95,
        },
      });

      const stats = await cleanupStateData(STATE_CODE, 30, 90, false);

      expect(stats.meetingsProcessed).toBe(1);
      expect(stats.gcsFilesDeleted).toBe(2);
      expect(stats.transcriptionsDeleted).toBe(0);

      const updated = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: "audio-ttl-only" },
      });
      expect(updated.audioDeletedAt).not.toBeNull();
      expect(updated.transcriptDeletedAt).toBeNull();

      const remainingTranscripts =
        await testPrismaClient.transcription.findMany({
          where: { meetingId: meeting.id },
        });
      expect(remainingTranscripts).toHaveLength(1);
    });

    test("cleans transcripts but not audio when only transcriptTTLDays has elapsed", async () => {
      // 45 days old: within audio TTL (90) but past transcript TTL (30)
      const meeting = await createExpiredMeeting("transcript-ttl-only", 45);
      await testPrismaClient.transcription.create({
        data: {
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.95,
        },
      });

      const stats = await cleanupStateData(STATE_CODE, 90, 30, false);

      expect(stats.meetingsProcessed).toBe(1);
      expect(stats.gcsFilesDeleted).toBe(0);
      expect(stats.transcriptionsDeleted).toBe(1);
      expect(mockListedFileDelete).not.toHaveBeenCalled();

      const updated = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: "transcript-ttl-only" },
      });
      expect(updated.audioDeletedAt).toBeNull();
      expect(updated.transcriptDeletedAt).not.toBeNull();
    });
  });

  describe("null TTL handling", () => {
    test("does not delete audio when audioTTLDays is null", async () => {
      const meeting = await createExpiredMeeting("null-audio-ttl-meeting", 60);
      await testPrismaClient.transcription.create({
        data: {
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.95,
        },
      });

      const stats = await cleanupStateData(
        STATE_CODE,
        null,
        TRANSCRIPT_TTL_DAYS,
        false,
      );

      expect(stats.meetingsProcessed).toBe(1);
      expect(stats.gcsFilesDeleted).toBe(0);
      expect(stats.transcriptionsDeleted).toBe(1);
      expect(mockListedFileDelete).not.toHaveBeenCalled();

      const updated = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: "null-audio-ttl-meeting" },
      });
      expect(updated.audioDeletedAt).toBeNull();
      expect(updated.transcriptDeletedAt).not.toBeNull();
    });

    test("does not delete transcriptions when transcriptTTLDays is null", async () => {
      const meeting = await createExpiredMeeting(
        "null-transcript-ttl-meeting",
        60,
      );
      await testPrismaClient.transcription.create({
        data: {
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.95,
        },
      });

      const stats = await cleanupStateData(
        STATE_CODE,
        AUDIO_TTL_DAYS,
        null,
        false,
      );

      expect(stats.meetingsProcessed).toBe(1);
      expect(stats.gcsFilesDeleted).toBe(2);
      expect(stats.transcriptionsDeleted).toBe(0);

      const updated = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: "null-transcript-ttl-meeting" },
      });
      expect(updated.audioDeletedAt).not.toBeNull();
      expect(updated.transcriptDeletedAt).toBeNull();

      const remainingTranscripts =
        await testPrismaClient.transcription.findMany({
          where: { meetingId: meeting.id },
        });
      expect(remainingTranscripts).toHaveLength(1);
    });

    test("returns zero stats and skips DB access when both TTLs are null", async () => {
      await createExpiredMeeting("both-null-ttl-meeting", 60);

      const stats = await cleanupStateData(STATE_CODE, null, null, false);

      expect(stats).toEqual({
        meetingsProcessed: 0,
        meetingsSkipped: 0,
        gcsFilesDeleted: 0,
        transcriptionsDeleted: 0,
        errors: [],
      });
      expect(mockGetPrismaClientForStateCode).not.toHaveBeenCalled();
      expect(mockListedFileDelete).not.toHaveBeenCalled();
    });
  });

  describe("dry run", () => {
    test("counts files but does not delete them from GCS", async () => {
      await createExpiredMeeting("dry-run-meeting", 60);

      const stats = await cleanupStateData(
        STATE_CODE,
        AUDIO_TTL_DAYS,
        TRANSCRIPT_TTL_DAYS,
        true,
      );

      expect(stats.meetingsProcessed).toBe(1);
      expect(stats.gcsFilesDeleted).toBe(2);
      expect(mockListedFileDelete).not.toHaveBeenCalled();
      expect(mockFileDelete).not.toHaveBeenCalled();
    });

    test("counts transcriptions but does not delete them from the database", async () => {
      const meeting = await createExpiredMeeting(
        "dry-run-with-transcription",
        60,
      );
      await testPrismaClient.transcription.create({
        data: {
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.95,
        },
      });

      const stats = await cleanupStateData(
        STATE_CODE,
        AUDIO_TTL_DAYS,
        TRANSCRIPT_TTL_DAYS,
        true,
      );

      expect(stats.transcriptionsDeleted).toBe(1);

      const remaining = await testPrismaClient.transcription.findMany({
        where: { meetingId: meeting.id },
      });
      expect(remaining).toHaveLength(1);
    });
  });

  describe("error handling", () => {
    test("counts failed meetings in errors and continues processing others", async () => {
      await createExpiredMeeting("failing-meeting", 60);
      await createExpiredMeeting("succeeding-meeting", 60);

      // Make a per-file delete fail once (for whichever meeting runs first)
      mockListedFileDelete.mockRejectedValueOnce(new Error("GCS error"));

      const stats = await cleanupStateData(
        STATE_CODE,
        AUDIO_TTL_DAYS,
        TRANSCRIPT_TTL_DAYS,
        false,
      );

      expect(stats.meetingsProcessed + stats.meetingsSkipped).toBe(2);
      expect(stats.meetingsSkipped).toBe(1);
      expect(stats.errors).toHaveLength(1);
      expect(stats.errors[0]).toContain("Meeting cleanup failed");
    });
  });
});

describe("cleanupMeetingData", () => {
  test("resolves without throwing even when a state has no configured database", async () => {
    // US_ME throws (see global beforeEach), US_NE succeeds — the function
    // must resolve rather than propagating the unhandled rejection.
    await expect(cleanupMeetingData(true)).resolves.toBeUndefined();
  });

  test("attempts cleanup for every state in AGENCY_CONFIGS that has at least one TTL configured", async () => {
    await cleanupMeetingData(true);

    const configsWithTTL = Object.values(AGENCY_CONFIGS).filter(
      (config) =>
        config.audioTTLDays !== null || config.transcriptTTLDays !== null,
    );
    expect(mockGetPrismaClientForStateCode).toHaveBeenCalledTimes(
      configsWithTTL.length,
    );
    for (const config of configsWithTTL) {
      expect(mockGetPrismaClientForStateCode).toHaveBeenCalledWith(
        config.stateCode,
      );
    }
  });

  test("continues processing remaining states when one state fails", async () => {
    await createExpiredMeeting("orchestration-test-meeting", 60);

    // US_ME fails (no DB), but US_NE should still find and process its meeting.
    await expect(cleanupMeetingData(true)).resolves.toBeUndefined();
    expect(mockGetFiles).toHaveBeenCalled();
  });
});
