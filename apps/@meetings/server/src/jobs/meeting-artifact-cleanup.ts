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

import { Storage } from "@google-cloud/storage";
import { subDays } from "date-fns";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import { getPrismaClientForStateCode } from "~@meetings/prisma";
import { logger } from "~server-setup-plugin/logger";

interface CleanupStats {
  meetingsProcessed: number;
  meetingsSkipped: number;
  gcsFilesDeleted: number;
  transcriptionsDeleted: number;
  errors: string[];
}

/**
 * Delete non-JSON files (audio chunks, stitched recordings) in a GCS folder.
 * JSON files like label-studio-task.json are preserved so transcript fields
 * can be scrubbed in-place during transcript cleanup.
 */
async function deleteAudioFilesInFolder(
  storage: Storage,
  bucket: string,
  folderPath: string,
  dryRun: boolean,
): Promise<number> {
  try {
    const [files] = await storage
      .bucket(bucket)
      .getFiles({ prefix: folderPath });

    const audioFiles = files.filter((file) => !file.name.endsWith(".json"));

    if (dryRun) {
      logger.info(
        `[DRY RUN] Would delete ${audioFiles.length} non-JSON files from gs://${bucket}/${folderPath}`,
      );
      return audioFiles.length;
    }

    if (audioFiles.length === 0) {
      return 0;
    }

    await Promise.all(audioFiles.map((file) => file.delete()));
    logger.info(
      `Deleted ${audioFiles.length} non-JSON files from gs://${bucket}/${folderPath}`,
    );
    return audioFiles.length;
  } catch (error) {
    logger.error(
      `Failed to delete audio files in gs://${bucket}/${folderPath}`,
      { error },
    );
    throw error;
  }
}

/**
 * Delete a single GCS file
 */
async function deleteGCSFile(
  storage: Storage,
  bucket: string,
  filePath: string,
  dryRun: boolean,
): Promise<boolean> {
  try {
    if (dryRun) {
      logger.info(`[DRY RUN] Would delete gs://${bucket}/${filePath}`);
      return true;
    }

    await storage.bucket(bucket).file(filePath).delete();
    logger.info(`Deleted gs://${bucket}/${filePath}`);
    return true;
  } catch (error) {
    // File may already be deleted or not exist
    const err = error as { code?: number };
    if (err.code === 404) {
      logger.info(`File already deleted: gs://${bucket}/${filePath}`);
      return false;
    }
    logger.error(`Failed to delete GCS file gs://${bucket}/${filePath}`, {
      error,
    });
    throw error;
  }
}

const LABEL_STUDIO_TASK_FILENAME = "label-studio-task.json";

/**
 * Remove transcript fields from the Label Studio task JSON in GCS.
 * The file is re-uploaded with transcript fields set to null.
 */
async function scrubTranscriptsFromLabelStudioTask(
  storage: Storage,
  bucket: string,
  recordingsFolderPath: string,
  dryRun: boolean,
): Promise<void> {
  const filePath = `${recordingsFolderPath}/${LABEL_STUDIO_TASK_FILENAME}`;
  const file = storage.bucket(bucket).file(filePath);

  const [exists] = await file.exists();
  if (!exists) {
    return;
  }

  if (dryRun) {
    logger.info(
      `[DRY RUN] Would scrub transcripts from gs://${bucket}/${filePath}`,
    );
    return;
  }

  const [content] = await file.download();
  const task = JSON.parse(content.toString());

  task.transcript_assemblyai = null;
  task.transcript_deepgram = null;
  task.transcript_best_provider = null;
  task.transcript_best_confidence = null;

  await file.save(JSON.stringify(task, null, 2), {
    contentType: "application/json",
  });

  logger.info(`Scrubbed transcripts from gs://${bucket}/${filePath}`);
}

interface MeetingCleanupResult {
  meetingId: string;
  success: boolean;
  filesDeleted: number;
  transcriptionsDeleted: number;
  error?: string;
}

/**
 * Clean up a single meeting's audio and/or transcription data based on TTL cutoffs
 */
async function cleanupMeeting(
  meeting: {
    id: string;
    recordingsGCSBucket: string;
    recordingsFolderPath: string;
    finalRecordingGCSPath: string | null;
    endTime: Date | null;
    audioDeletedAt: Date | null;
    transcriptDeletedAt: Date | null;
    transcriptions: { id: string }[];
  },
  storage: Storage,
  prisma: ReturnType<typeof getPrismaClientForStateCode>,
  audioCutoffDate: Date | null,
  transcriptCutoffDate: Date | null,
  dryRun: boolean,
): Promise<MeetingCleanupResult> {
  let filesDeleted = 0;
  let transcriptionsDeleted = 0;

  const shouldCleanAudio =
    audioCutoffDate !== null &&
    !meeting.audioDeletedAt &&
    meeting.endTime !== null &&
    meeting.endTime < audioCutoffDate;

  const shouldCleanTranscript =
    transcriptCutoffDate !== null &&
    !meeting.transcriptDeletedAt &&
    meeting.endTime !== null &&
    meeting.endTime < transcriptCutoffDate;

  if (shouldCleanAudio) {
    // Delete final stitched recording (usually inside the folder, but explicit just in case)
    if (meeting.finalRecordingGCSPath) {
      const deleted = await deleteGCSFile(
        storage,
        meeting.recordingsGCSBucket,
        meeting.finalRecordingGCSPath,
        dryRun,
      );
      if (deleted) filesDeleted += 1;
    }

    // Delete audio files in the recordings folder (individual chunks).
    // The label-studio-task.json file is preserved so it can be scrubbed
    // when transcripts are cleaned up.
    if (meeting.recordingsFolderPath) {
      filesDeleted += await deleteAudioFilesInFolder(
        storage,
        meeting.recordingsGCSBucket,
        meeting.recordingsFolderPath,
        dryRun,
      );
    }

    if (!dryRun) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { finalRecordingGCSPath: null, audioDeletedAt: new Date() },
      });
    }
  }

  if (shouldCleanTranscript) {
    const transcriptionCount = meeting.transcriptions.length;
    if (transcriptionCount > 0) {
      if (dryRun) {
        logger.info(
          `[DRY RUN] Would delete ${transcriptionCount} transcriptions for meeting ${meeting.id}`,
        );
      } else {
        await prisma.utterance.deleteMany({
          where: { transcription: { meetingId: meeting.id } },
        });

        await prisma.transcription.deleteMany({
          where: { meetingId: meeting.id },
        });

        logger.info(
          `Deleted ${transcriptionCount} transcriptions for meeting ${meeting.id}`,
        );
      }
      transcriptionsDeleted = transcriptionCount;
    }

    // Scrub transcript data from the Label Studio task JSON in GCS
    await scrubTranscriptsFromLabelStudioTask(
      storage,
      meeting.recordingsGCSBucket,
      meeting.recordingsFolderPath,
      dryRun,
    );

    if (!dryRun) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { transcriptDeletedAt: new Date() },
      });
    }
  }

  logger.info(`Cleaned up meeting ${meeting.id}`, {
    endTime: meeting.endTime,
    filesDeleted,
    transcriptionsDeleted,
    dryRun,
  });

  return {
    meetingId: meeting.id,
    success: true,
    filesDeleted,
    transcriptionsDeleted,
  };
}

export async function cleanupStateData(
  stateCode: string,
  audioTTLDays: number | null,
  transcriptTTLDays: number | null,
  dryRun: boolean,
): Promise<CleanupStats> {
  const emptyStats: CleanupStats = {
    meetingsProcessed: 0,
    meetingsSkipped: 0,
    gcsFilesDeleted: 0,
    transcriptionsDeleted: 0,
    errors: [],
  };

  if (audioTTLDays === null && transcriptTTLDays === null) {
    return emptyStats;
  }

  const prisma = getPrismaClientForStateCode(stateCode);
  const storage = new Storage();

  const audioCutoffDate =
    audioTTLDays !== null ? subDays(new Date(), audioTTLDays) : null;
  const transcriptCutoffDate =
    transcriptTTLDays !== null ? subDays(new Date(), transcriptTTLDays) : null;

  const orConditions = [
    ...(audioCutoffDate
      ? [{ endTime: { lt: audioCutoffDate }, audioDeletedAt: null }]
      : []),
    ...(transcriptCutoffDate
      ? [{ endTime: { lt: transcriptCutoffDate }, transcriptDeletedAt: null }]
      : []),
  ];

  const expiredMeetings = await prisma.meeting.findMany({
    where: {
      endTime: { not: null },
      OR: orConditions,
    },
    select: {
      id: true,
      recordingsGCSBucket: true,
      recordingsFolderPath: true,
      finalRecordingGCSPath: true,
      endTime: true,
      audioDeletedAt: true,
      transcriptDeletedAt: true,
      transcriptions: {
        select: { id: true },
      },
    },
  });

  const results = await Promise.allSettled(
    expiredMeetings.map((meeting) =>
      cleanupMeeting(
        meeting,
        storage,
        prisma,
        audioCutoffDate,
        transcriptCutoffDate,
        dryRun,
      ),
    ),
  );

  // Aggregate results into stats
  const stats: CleanupStats = {
    meetingsProcessed: 0,
    meetingsSkipped: 0,
    gcsFilesDeleted: 0,
    transcriptionsDeleted: 0,
    errors: [],
  };

  for (const result of results) {
    if (result.status === "fulfilled") {
      stats.meetingsProcessed += 1;
      stats.gcsFilesDeleted += result.value.filesDeleted;
      stats.transcriptionsDeleted += result.value.transcriptionsDeleted;
    } else {
      stats.meetingsSkipped += 1;
      const errorMessage = `Meeting cleanup failed: ${result.reason}`;
      stats.errors.push(errorMessage);
      logger.error(errorMessage, { error: result.reason });
    }
  }

  return stats;
}

export async function cleanupMeetingData(dryRun = true): Promise<void> {
  const results = await Promise.allSettled(
    Object.values(AGENCY_CONFIGS).map((config) =>
      cleanupStateData(
        config.stateCode,
        config.audioTTLDays ?? null,
        config.transcriptTTLDays ?? null,
        dryRun,
      ),
    ),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error(
        `failed to run meeting clean up job with error ${result.reason}`,
      );
    }
  }
}

// Run cleanup when this file is the entry point (not when imported as a module)
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  cleanupMeetingData(false)
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      console.error("Meeting artifact cleanup job failed:", e);
      process.exit(1);
    });
}
