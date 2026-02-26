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

import { AGENCY_CONFIGS } from "~@meetings/config";
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
 * Delete all files in a GCS folder
 */
async function deleteGCSFolder(
  storage: Storage,
  bucket: string,
  folderPath: string,
  dryRun: boolean,
): Promise<number> {
  try {
    const [files] = await storage
      .bucket(bucket)
      .getFiles({ prefix: folderPath });

    if (dryRun) {
      logger.info(
        `[DRY RUN] Would delete ${files.length} files from gs://${bucket}/${folderPath}`,
      );
      return files.length;
    }

    if (files.length === 0) {
      return 0;
    }

    await storage.bucket(bucket).deleteFiles({ prefix: folderPath });
    logger.info(
      `Deleted ${files.length} files from gs://${bucket}/${folderPath}`,
    );
    return files.length;
  } catch (error) {
    logger.error(`Failed to delete GCS folder gs://${bucket}/${folderPath}`, {
      error,
    });
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
  audioCutoffDate: Date,
  transcriptCutoffDate: Date,
  dryRun: boolean,
): Promise<MeetingCleanupResult> {
  let filesDeleted = 0;
  let transcriptionsDeleted = 0;

  const shouldCleanAudio =
    !meeting.audioDeletedAt &&
    meeting.endTime !== null &&
    meeting.endTime < audioCutoffDate;

  const shouldCleanTranscript =
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

    // Delete recordings folder (contains individual audio chunks)
    if (meeting.recordingsFolderPath) {
      filesDeleted += await deleteGCSFolder(
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
  audioTTLDays: number,
  transcriptTTLDays: number,
  dryRun: boolean,
): Promise<CleanupStats> {
  const prisma = getPrismaClientForStateCode(stateCode);
  const storage = new Storage();

  const audioCutoffDate = subDays(new Date(), audioTTLDays);
  const transcriptCutoffDate = subDays(new Date(), transcriptTTLDays);

  const expiredMeetings = await prisma.meeting.findMany({
    where: {
      endTime: { not: null },
      OR: [
        { endTime: { lt: audioCutoffDate }, audioDeletedAt: null },
        { endTime: { lt: transcriptCutoffDate }, transcriptDeletedAt: null },
      ],
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
  for (const [stateCode, config] of Object.entries(AGENCY_CONFIGS)) {
    try {
      cleanupStateData(
        stateCode,
        config.audioTTLDays,
        config.transcriptTTLDays,
        dryRun,
      );
    } catch (error) {
      logger.error(`failed to run meeting clean up job with error ${error}`);
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
