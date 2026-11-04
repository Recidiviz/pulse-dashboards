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
import {
  cleanupMeetingData,
  cleanupStateData,
} from "~@meetings/server/jobs/meeting-artifact-cleanup";
import { redactTranscriptObject } from "~@meetings/server/jobs/transcript-redaction";
import { testPrismaClient } from "~@meetings/server/test/setup";
import { fakeClient, fakeStaff } from "~@meetings/server/test/setup/seed";
import { NOT_AVAILABLE } from "~@meetings/tasks";
import { getAgencyConfigs } from "~@meetings/trpc/routes/config/utils";

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

// Synthetic provider payloads with the text-bearing fields each provider uses.
const WORD = { start: 0, end: 500, confidence: 0.99, speaker: "A" };
const FAKE_ASSEMBLYAI_TRANSCRIPT = {
  confidence: 0.95,
  audio_duration: 2,
  text: "Hello there",
  summary: "Two people greeted each other.",
  words: [{ ...WORD, text: "Hello" }],
  utterances: [{ ...WORD, text: "Hello", words: [{ ...WORD, text: "Hello" }] }],
};
const DG_WORD = { word: "hello", start: 0, end: 0.5, confidence: 0.99 };
const FAKE_DEEPGRAM_TRANSCRIPT = {
  metadata: { request_id: "req-1", duration: 1.5, channels: 1 },
  results: {
    channels: [
      {
        alternatives: [
          { transcript: "Hello", confidence: 0.93, words: [DG_WORD] },
        ],
      },
    ],
    utterances: [
      { ...DG_WORD, transcript: "Hello", speaker: 0, words: [DG_WORD] },
    ],
    summary: { result: "A summary quoting the conversation." },
  },
};

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
      transcriptionsRedacted: 0,
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
    expect(stats.transcriptionsRedacted).toBe(1);
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

  test("redacts transcript text in place instead of deleting rows", async () => {
    const meeting = await createExpiredMeeting(
      "expired-with-transcription",
      60,
    );
    await testPrismaClient.transcription.createMany({
      data: [
        {
          id: "t-assemblyai",
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject:
            FAKE_ASSEMBLYAI_TRANSCRIPT as unknown as PrismaJson.TranscriptType,
          confidence: 0.95,
        },
        {
          id: "t-deepgram",
          meetingId: meeting.id,
          provider: TranscriptionProvider.DEEPGRAM,
          transcriptObject:
            FAKE_DEEPGRAM_TRANSCRIPT as unknown as PrismaJson.TranscriptType,
          confidence: 0.91,
          summary: "A summary quoting the conversation.",
        },
      ],
    });
    await testPrismaClient.utterance.create({
      data: {
        transcriptionId: "t-assemblyai",
        speaker: "A",
        text: "Hello",
        startTimeMs: 0,
        endTimeMs: 500,
        confidence: 0.99,
      },
    });

    const stats = await cleanupStateData(
      STATE_CODE,
      AUDIO_TTL_DAYS,
      TRANSCRIPT_TTL_DAYS,
      false,
    );

    expect(stats.transcriptionsRedacted).toBe(2);

    const [assemblyAI, deepgram] =
      await testPrismaClient.transcription.findMany({
        where: { meetingId: meeting.id },
        include: { utterances: true },
        orderBy: { provider: "asc" },
      });

    expect(assemblyAI.utterances).toEqual([
      expect.objectContaining({ speaker: "A", text: null, confidence: 0.99 }),
    ]);
    expect(assemblyAI.transcriptObject).toEqual({
      redacted: true,
      confidence: 0.95,
      audio_duration: 2,
      words: [WORD],
      utterances: [{ ...WORD, words: [WORD] }],
    });

    const redactedDgWord = {
      start: 0,
      end: 0.5,
      confidence: 0.99,
      speaker: null,
    };
    expect(deepgram.summary).toBeNull();
    expect(deepgram.transcriptObject).toEqual({
      redacted: true,
      metadata: { duration: 1.5, channels: 1 },
      results: {
        channels: [
          { alternatives: [{ confidence: 0.93, words: [redactedDgWord] }] },
        ],
        utterances: [
          { ...redactedDgWord, speaker: 0, words: [redactedDgWord] },
        ],
      },
    });
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

  test("scrubs transcript and staff_notes from the LLMAJ triage task JSON when cleaning transcripts", async () => {
    const meeting = await createExpiredMeeting("expired-scrub-triage", 60);
    await testPrismaClient.transcription.create({
      data: {
        meetingId: meeting.id,
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
      },
    });

    const originalTask = {
      audio: "gs://test-bucket/meetings/expired-scrub-triage/final.m4a",
      transcript: "[A]: Hello",
      staff_notes: "Ask about bus pass",
      case_note: "Some notes",
      meta: { "Meeting ID": meeting.id },
    };
    // The full-review task file doesn't exist for this meeting; the triage file does.
    mockFileExists.mockResolvedValueOnce([false]);
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
    expect(savedJson.transcript).toBe(NOT_AVAILABLE);
    expect(savedJson.staff_notes).toBe(NOT_AVAILABLE);
    // Non-transcript fields should be preserved
    expect(savedJson.case_note).toBe("Some notes");
    expect(savedJson.audio).toBe(
      "gs://test-bucket/meetings/expired-scrub-triage/final.m4a",
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
      expect(stats.transcriptionsRedacted).toBe(0);

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
      expect(stats.transcriptionsRedacted).toBe(1);
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
      expect(stats.transcriptionsRedacted).toBe(1);
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
      expect(stats.transcriptionsRedacted).toBe(0);

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
        transcriptionsRedacted: 0,
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

    test("counts transcriptions but does not redact them in the database", async () => {
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

      expect(stats.transcriptionsRedacted).toBe(1);

      const remaining = await testPrismaClient.transcription.findMany({
        where: { meetingId: meeting.id },
      });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].transcriptObject).toEqual({});
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

    test("redacts the DB but leaves transcriptDeletedAt unset when the Label Studio scrub fails", async () => {
      const meeting = await createExpiredMeeting("scrub-fails", 60);
      await testPrismaClient.transcription.create({
        data: {
          meetingId: meeting.id,
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject:
            FAKE_ASSEMBLYAI_TRANSCRIPT as unknown as PrismaJson.TranscriptType,
          utterances: {
            create: {
              speaker: "A",
              text: "Hello",
              startTimeMs: 0,
              endTimeMs: 500,
              confidence: 0.99,
            },
          },
        },
      });
      mockFileExists.mockResolvedValueOnce([true]);
      mockFileDownload.mockRejectedValueOnce(new Error("GCS error"));

      const stats = await cleanupStateData(
        STATE_CODE,
        null,
        TRANSCRIPT_TTL_DAYS,
        false,
      );

      expect(stats.meetingsSkipped).toBe(1);
      const updated = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: meeting.id },
        include: { transcriptions: { include: { utterances: true } } },
      });
      expect(updated.transcriptDeletedAt).toBeNull();
      expect(updated.transcriptions[0].utterances[0].text).toBeNull();
    });
  });
});

describe("redactTranscriptObject", () => {
  test("keeps only numbers and speaker labels from malformed payloads", () => {
    expect(
      redactTranscriptObject(TranscriptionProvider.ASSEMBLYAI, {
        confidence: "Hello there",
        words: {},
        utterances: [
          { start: 0, end: 1, confidence: { text: "Hi" }, speaker: ["A"] },
        ],
      }),
    ).toEqual({
      redacted: true,
      confidence: null,
      audio_duration: null,
      words: [],
      utterances: [
        { start: 0, end: 1, confidence: null, speaker: null, words: [] },
      ],
    });
    expect(
      redactTranscriptObject(TranscriptionProvider.DEEPGRAM, {
        results: { channels: [{}] },
      }),
    ).toEqual({
      redacted: true,
      metadata: { duration: 0, channels: 0 },
      results: { channels: [{ alternatives: [] }], utterances: [] },
    });
    expect(
      redactTranscriptObject(TranscriptionProvider.DEEPGRAM, null),
    ).toMatchObject({ redacted: true });
  });
});

describe("cleanupMeetingData", () => {
  test("resolves without throwing even when a state has no configured database", async () => {
    // US_CO throws (see global beforeEach), US_NE succeeds — the function
    // must resolve rather than propagating the unhandled rejection.
    await expect(cleanupMeetingData(true)).resolves.toBeUndefined();
  });

  test("attempts cleanup for every configured state that has at least one TTL configured", async () => {
    await cleanupMeetingData(true);

    const configsWithTTL = Object.values(await getAgencyConfigs()).filter(
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

    // US_CO fails (no DB), but US_NE should still find and process its meeting.
    await expect(cleanupMeetingData(true)).resolves.toBeUndefined();
    expect(mockGetFiles).toHaveBeenCalled();
  });
});
