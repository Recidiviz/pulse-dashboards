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

import { TranscriptionProvider } from "~@meetings/prisma/client";
import { cleanupStateData } from "~@meetings/server/jobs/meeting-artifact-cleanup";
import { testPrismaClient } from "~@meetings/server/test/setup";
import { fakeClient, fakeStaff } from "~@meetings/server/test/setup/seed";

const mockGetFiles = vi.fn();
const mockDeleteFiles = vi.fn().mockResolvedValue(undefined);
const mockFileDelete = vi.fn().mockResolvedValue(undefined);

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => ({
    bucket: vi.fn().mockReturnValue({
      getFiles: mockGetFiles,
      deleteFiles: mockDeleteFiles,
      file: vi.fn().mockReturnValue({
        delete: mockFileDelete,
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

describe("cleanupStateData", () => {
  beforeEach(() => {
    // Default: bucket has 2 audio chunks
    mockGetFiles.mockResolvedValue([
      [{ name: "chunk-1.m4a" }, { name: "chunk-2.m4a" }],
    ]);
  });

  test("returns zero stats when there are no expired meetings", async () => {
    // Only the seeded fakeMeeting exists (endTime is null — won't be selected)
    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

    expect(stats).toEqual({
      meetingsProcessed: 0,
      meetingsSkipped: 0,
      gcsFilesDeleted: 0,
      transcriptionsDeleted: 0,
      errors: [],
    });
    expect(mockDeleteFiles).not.toHaveBeenCalled();
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test("skips meetings where both transcriptDeletedAt and audioDeletedAt are already set", async () => {
    await createExpiredMeeting("already-cleaned-meeting", 60, {
      transcriptDeletedAt: new Date(),
      audioDeletedAt: new Date(),
    });

    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

    expect(stats.meetingsProcessed).toBe(0);
    expect(mockDeleteFiles).not.toHaveBeenCalled();
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
    expect(mockDeleteFiles).not.toHaveBeenCalled();
  });

  test("does not clean up meetings within the TTL window", async () => {
    await createExpiredMeeting("recent-meeting", 5); // 5 days ago, within 30-day TTL

    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

    expect(stats.meetingsProcessed).toBe(0);
    expect(mockDeleteFiles).not.toHaveBeenCalled();
  });

  test("deletes recordings folder for expired meetings", async () => {
    await createExpiredMeeting("expired-meeting", 60);

    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

    expect(stats.meetingsProcessed).toBe(1);
    expect(stats.gcsFilesDeleted).toBe(2);
    expect(mockDeleteFiles).toHaveBeenCalledWith({
      prefix: "meetings/expired-meeting",
    });
  });

  test("deletes the final stitched recording file when present", async () => {
    await createExpiredMeeting("expired-with-final", 60, {
      finalRecordingGCSPath: "final/expired-with-final.m4a",
    });

    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

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

    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

    expect(stats.transcriptionsDeleted).toBe(1);

    const remaining = await testPrismaClient.transcription.findMany({
      where: { meetingId: meeting.id },
    });
    expect(remaining).toHaveLength(0);
  });

  test("sets audioDeletedAt, transcriptDeletedAt, and clears finalRecordingGCSPath after cleanup", async () => {
    await createExpiredMeeting("expired-clear-fields", 60, {
      finalRecordingGCSPath: "final/recording.m4a",
    });

    await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

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

    const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

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

      const remainingTranscripts = await testPrismaClient.transcription.findMany(
        { where: { meetingId: meeting.id } },
      );
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
      expect(mockDeleteFiles).not.toHaveBeenCalled();

      const updated = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: "transcript-ttl-only" },
      });
      expect(updated.audioDeletedAt).toBeNull();
      expect(updated.transcriptDeletedAt).not.toBeNull();
    });
  });

  describe("dry run", () => {
    test("counts files but does not delete them from GCS", async () => {
      await createExpiredMeeting("dry-run-meeting", 60);

      const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, true);

      expect(stats.meetingsProcessed).toBe(1);
      expect(stats.gcsFilesDeleted).toBe(2);
      expect(mockDeleteFiles).not.toHaveBeenCalled();
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

      const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, true);

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

      // Make GCS deleteFiles fail once (for whichever meeting runs first)
      mockDeleteFiles.mockRejectedValueOnce(new Error("GCS error"));

      const stats = await cleanupStateData(STATE_CODE, AUDIO_TTL_DAYS, TRANSCRIPT_TTL_DAYS, false);

      expect(stats.meetingsProcessed + stats.meetingsSkipped).toBe(2);
      expect(stats.meetingsSkipped).toBe(1);
      expect(stats.errors).toHaveLength(1);
      expect(stats.errors[0]).toContain("Meeting cleanup failed");
    });
  });
});
