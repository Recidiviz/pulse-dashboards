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
 * Exports meeting data as Label Studio task JSON files, one per meeting.
 *
 * Each JSON file is written to the same GCS bucket as the meeting's audio file,
 * at the path: <recordingsFolderPath>/label-studio-task.json
 *
 * ## Prerequisites
 *
 * This script connects to Cloud SQL via the Cloud SQL Auth Proxy. Start it before
 * running the script:
 *
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meeting
 *   # or for production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meeting
 *
 * ## Running
 *
 * Run `nx export-label-studio-tasks @meetings/server --args="--help"` for usage.
 */

import { Command } from "@commander-js/extra-typings";
import { Storage } from "@google-cloud/storage";
import { PrismaPg } from "@prisma/adapter-pg";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import {
  Prisma,
  PrismaClient,
  StateCode,
  TranscriptionProvider,
} from "~@meetings/prisma/client";

interface ScriptArgs {
  stateCodes: StateCode[];
  meetingId?: string;
  dryRun: boolean;
}

function parseArgs(): ScriptArgs {
  const configuredStateCodes = Object.keys(AGENCY_CONFIGS);

  const program = new Command()
    .name("export-label-studio-tasks")
    .description(
      "Export meeting data as Label Studio task JSON files to GCS, one file per meeting",
    )
    .option(
      "--state-codes <state-codes>",
      `Comma-separated state code(s) to export (e.g. US_NE or US_NE,US_PA). If omitted, exports all configured states: ${configuredStateCodes.join(", ")}`,
    )
    .option(
      "--meeting-id <meeting-id>",
      "Export a single meeting by ID. Requires --state-codes.",
    )
    .option(
      "--dry-run [bool]",
      "Print task JSON to stdout instead of writing to GCS",
      false,
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
    dryRun: options.dryRun === "false" ? false : Boolean(options.dryRun),
  };
}

const meetingInclude = {
  client: true,
  resident: true,
  transcriptions: {
    include: {
      utterances: {
        orderBy: { startTimeMs: "asc" as const },
      },
    },
    orderBy: { confidence: "desc" as const },
  },
} satisfies Prisma.MeetingInclude;

type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: typeof meetingInclude;
}>;

/** Format utterances from a transcription into the same text input used for the LLM. */
function utterancesToRawText(
  utterances: { speaker: string; text: string }[],
): string {
  return utterances.map((u) => `[${u.speaker}]: ${u.text}`).join("\n");
}

/** Format a duration in seconds as "Xm Ys". */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

async function exportMeetingsForStateCode(
  stateCode: StateCode,
  meetingId: string | undefined,
  dryRun: boolean,
  storage: Storage,
  dbUrlTemplate: string,
): Promise<{ success: number; skipped: number; errors: number }> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrlTemplate.replace(
        "{state}",
        stateCode.toLowerCase(),
      ),
    }),
  });

  const meetings: MeetingWithRelations[] = await prisma.meeting.findMany({
    where: {
      ...(meetingId
        ? { id: meetingId }
        : { postMeetingProcessingStatus: "COMPLETED" }),
    },
    include: meetingInclude,
    orderBy: { startTime: "asc" },
  });

  console.log(`  ${stateCode}: ${meetings.length} meeting(s)`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const meeting of meetings) {
    try {
      if (meeting.transcriptions.length === 0) {
        console.warn(`    ⚠️  Skipping ${meeting.id} — no transcriptions`);
        skipped++;
        continue;
      }

      const person = meeting.client ?? meeting.resident;

      // Build per-provider transcript texts
      const transcriptsByProvider: Partial<
        Record<"assemblyai" | "deepgram", string>
      > = {};
      for (const transcription of meeting.transcriptions) {
        const providerKey =
          transcription.provider === TranscriptionProvider.ASSEMBLYAI
            ? "assemblyai"
            : "deepgram";
        transcriptsByProvider[providerKey] = utterancesToRawText(
          transcription.utterances,
        );
      }

      // Best transcription is first (ordered by confidence desc)
      const bestTranscription = meeting.transcriptions[0];

      const durationSeconds =
        meeting.endTime && meeting.startTime
          ? Math.floor(
              (meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000,
            )
          : null;

      const task = {
        audio: meeting.finalRecordingGCSPath
          ? `gs://${meeting.recordingsGCSBucket}/${meeting.finalRecordingGCSPath}`
          : null,

        // ── Transcripts (formatted as LLM input) ────────────────────────────
        transcript_assemblyai: transcriptsByProvider["assemblyai"] ?? null,
        transcript_deepgram: transcriptsByProvider["deepgram"] ?? null,
        transcript_best_provider:
          bestTranscription.provider === TranscriptionProvider.ASSEMBLYAI
            ? "assemblyai"
            : "deepgram",
        transcript_best_confidence: bestTranscription.confidence ?? null,

        // ── LLM outputs ─────────────────────────────────────────────────────
        case_note: meeting.caseNote ?? null,
        action_items:
          (meeting.actionItems as string[] | null)?.join("\n") ?? null,
        critical_updates:
          (meeting.criticalUpdates as string[] | null)?.join("\n") ?? null,

        // ── Meta (human-readable labels for Label Studio <Table> widget) ────
        meta: {
          State: stateCode,
          "Recording date": meeting.startTime.toISOString().split("T")[0],
          Duration:
            durationSeconds !== null ? formatDuration(durationSeconds) : null,
          "Meeting ID": meeting.id,
          "Person Display ID": person?.displayPersonExternalId ?? null,
          "Processing status": meeting.postMeetingProcessingStatus,
        },
      };

      const outputPath = `${meeting.recordingsFolderPath}/label-studio-task.json`;
      const taskJson = JSON.stringify(task, null, 2);

      if (dryRun) {
        console.log(
          `\n--- ${meeting.id} → gs://${meeting.recordingsGCSBucket}/${outputPath} ---`,
        );
        console.log(taskJson);
      } else {
        const file = storage
          .bucket(meeting.recordingsGCSBucket)
          .file(outputPath);
        // eslint-disable-next-line no-await-in-loop
        await file.save(taskJson, { contentType: "application/json" });
        console.log(
          `    ✅ ${meeting.id} → gs://${meeting.recordingsGCSBucket}/${outputPath}`,
        );
      }

      success++;
    } catch (err) {
      console.error(
        `    ❌ Error exporting meeting ${meeting.id}:`,
        err instanceof Error ? err.message : err,
      );
      errors++;
    }
  }

  return { success, skipped, errors };
}

async function main() {
  console.log("📋 Label Studio Task Export\n");

  const { stateCodes, meetingId, dryRun } = parseArgs();
  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    throw new Error("Missing DATABASE_URL_TEMPLATE environment variable");
  }

  const storage = new Storage();

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const stateCode of stateCodes) {
    // eslint-disable-next-line no-await-in-loop
    const { success, skipped, errors } = await exportMeetingsForStateCode(
      stateCode,
      meetingId,
      dryRun,
      storage,
      dbUrlTemplate,
    );
    totalSuccess += success;
    totalSkipped += skipped;
    totalErrors += errors;
  }

  console.log(
    `\nDone. ${totalSuccess} exported, ${totalSkipped} skipped, ${totalErrors} errors.`,
  );

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
