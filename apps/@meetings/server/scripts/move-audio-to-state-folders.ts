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

/**
 * One-time migration: moves each meeting's GCS audio objects from
 *   <bucket>/<meetingId>/*
 * to
 *   <bucket>/<stateCode>/<meetingId>/*
 * to match the ETL bucket's per-state folder structure, and updates the
 * corresponding `recordingsFolderPath` / `finalRecordingGCSPath` columns on
 * the `Meeting` records in the db.
 *
 * Safe to re-run: meetings whose `recordingsFolderPath` already starts with
 * `<stateCode>/` are skipped, so an interrupted run can just be re-invoked.
 *
 * ## Prerequisites
 *
 * This script connects to Cloud SQL via the Cloud SQL Auth Proxy. Start it before
 * running the script:
 *
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meetings
 *   # or for production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meetings
 *
 * ## Running
 *
 * Run `nx move-audio-to-state-folders @meetings/server --args="--help"` for usage.
 */

import { Command } from "@commander-js/extra-typings";
import { File, Storage } from "@google-cloud/storage";
import { PrismaPg } from "@prisma/adapter-pg";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import { PrismaClient, StateCode } from "~@meetings/prisma/client";

interface ScriptArgs {
  stateCodes: StateCode[];
  meetingId?: string;
  dryRun: boolean;
}

function parseArgs(): ScriptArgs {
  const configuredStateCodes = Object.keys(AGENCY_CONFIGS);

  const program = new Command()
    .name("move-audio-to-state-folders")
    .description(
      "Move meeting audio GCS objects into per-state folders and update the matching DB paths",
    )
    .option(
      "--state-codes <state-codes>",
      `Comma-separated state code(s) to migrate (e.g. US_NE or US_NE,US_PA). If omitted, migrates all configured states: ${configuredStateCodes.join(", ")}`,
    )
    .option(
      "--meeting-id <meeting-id>",
      "Migrate a single meeting by ID. Requires --state-codes.",
    )
    .option(
      "--dry-run [bool]",
      "Print planned moves/updates instead of performing them",
    )
    .parse();

  const options = program.opts();

  const rawStateCodes: string[] = options.stateCodes
    ? options.stateCodes.split(",").map((s: string) => s.trim())
    : configuredStateCodes;

  const stateCodes = rawStateCodes.map((code) => {
    if (!configuredStateCodes.includes(code)) {
      console.error(
        `Invalid or unconfigured state code: ${code}. Valid values: ${configuredStateCodes.join(", ")}`,
      );
      process.exit(1);
    }
    return code as StateCode;
  });

  if (options.meetingId && !options.stateCodes) {
    console.error("--meeting-id requires --state-code");
    process.exit(1);
  }

  return {
    stateCodes,
    meetingId: options.meetingId,
    dryRun: options.dryRun ? true : false,
  };
}

interface MeetingToMigrate {
  id: string;
  recordingsGCSBucket: string;
  recordingsFolderPath: string;
  finalRecordingGCSPath: string | null;
}

/**
 * GCS storage location update step
 */
async function moveMeetingFilesInGCS(
  storage: Storage,
  meeting: MeetingToMigrate,
  oldPrefix: string,
  newPrefix: string,
  dryRun: boolean,
): Promise<number> {
  const [files] = await storage
    .bucket(meeting.recordingsGCSBucket)
    .getFiles({ prefix: `${oldPrefix}/` });

  if (dryRun) {
    for (const file of files) {
      const newName = newPrefix + file.name.slice(oldPrefix.length);

      console.log(
        `    [DRY RUN] gs://${meeting.recordingsGCSBucket}/${file.name} -> gs://${meeting.recordingsGCSBucket}/${newName}`,
      );
    }
    return files.length;
  }

  await Promise.all(
    files.map((file: File) => {
      const newName = newPrefix + file.name.slice(oldPrefix.length);
      return file.move(newName);
    }),
  );

  return files.length;
}

async function moveAudioStorageForMeeting(
  storage: Storage,
  prisma: PrismaClient,
  stateCode: StateCode,
  meeting: MeetingToMigrate,
  dryRun: boolean,
): Promise<{ filesMoved: number }> {
  const oldPrefix = meeting.recordingsFolderPath;
  const newPrefix = `${stateCode}/${meeting.id}`;

  if (oldPrefix !== meeting.id) {
    throw new Error(
      `recordingsFolderPath ("${oldPrefix}") does not match the meeting id — ` +
        "does not follow the expected <meetingId> convention, skipping to avoid corrupting the path",
    );
  }

  const filesMoved = await moveMeetingFilesInGCS(
    storage,
    meeting,
    oldPrefix,
    newPrefix,
    dryRun,
  );

  const newFinalRecordingGCSPath = meeting.finalRecordingGCSPath
    ? newPrefix + meeting.finalRecordingGCSPath.slice(oldPrefix.length)
    : null;

  if (dryRun) {
    console.log(
      `    [DRY RUN] recordingsFolderPath: "${oldPrefix}" -> "${newPrefix}"` +
        (meeting.finalRecordingGCSPath
          ? `, finalRecordingGCSPath: "${meeting.finalRecordingGCSPath}" -> "${newFinalRecordingGCSPath}"`
          : ""),
    );
  } else {
    // Meeting record update step
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        recordingsFolderPath: newPrefix,
        ...(meeting.finalRecordingGCSPath && {
          finalRecordingGCSPath: newFinalRecordingGCSPath,
        }),
      },
    });
  }

  return { filesMoved };
}

async function moveAudioStorageForStateCode(
  stateCode: StateCode,
  meetingId: string | undefined,
  dryRun: boolean,
  storage: Storage,
  dbUrlTemplate: string,
): Promise<{ success: number; errors: number }> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrlTemplate.replace(
        "{state}",
        stateCode.toLowerCase(),
      ),
    }),
  });

  const meetingWhere = meetingId ? { id: meetingId } : {};

  const meetings: MeetingToMigrate[] = await prisma.meeting.findMany({
    where: {
      ...meetingWhere,
      NOT: { recordingsFolderPath: { startsWith: `${stateCode}/` } },
    },
    select: {
      id: true,
      recordingsGCSBucket: true,
      recordingsFolderPath: true,
      finalRecordingGCSPath: true,
    },
    orderBy: { startTime: "asc" },
  });

  console.log(
    `  ${stateCode}: ${meetings.length} meeting(s) to move; (skipping any that already are grouped by state)`,
  );

  let success = 0;
  let errors = 0;

  for (const meeting of meetings) {
    if (meeting.recordingsGCSBucket === "test-audio-bucket") continue;
    try {
      console.log(
        `    Updating storage location for meeting: ${meeting.id}...`,
      );
      // eslint-disable-next-line no-await-in-loop
      const { filesMoved } = await moveAudioStorageForMeeting(
        storage,
        prisma,
        stateCode,
        meeting,
        dryRun,
      );
      console.log(
        `    ${dryRun ? "[DRY RUN]" : ""} ✅ ${meeting.id} — ${filesMoved} file(s) moved`,
      );
      success++;
    } catch (err) {
      console.error(
        `     ${dryRun ? "[DRY RUN]" : ""} ❌ Error migrating meeting ${meeting.id}:`,
        err instanceof Error ? err.message : err,
      );
      errors++;
    }
  }

  return { success, errors };
}

async function main() {
  console.log("Meeting Audio Storage Migration\n");

  const { stateCodes, meetingId, dryRun } = parseArgs();
  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    throw new Error("Missing DATABASE_URL_TEMPLATE environment variable");
  }

  const storage = new Storage();

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const stateCode of stateCodes) {
    // eslint-disable-next-line no-await-in-loop
    const { success, errors } = await moveAudioStorageForStateCode(
      stateCode,
      meetingId,
      dryRun,
      storage,
      dbUrlTemplate,
    );
    totalSuccess += success;
    totalErrors += errors;
  }

  console.log(
    `\n ${dryRun ? "[DRY RUN]" : ""} Done. ${totalSuccess} moved, ${totalErrors} errors.`,
  );

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
