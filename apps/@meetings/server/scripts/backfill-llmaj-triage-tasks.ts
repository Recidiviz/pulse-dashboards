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
 * Gives every judge-BAD meeting still waiting, unlabeled, in the full-review
 * Label Studio project an LLMAJ triage task, written to
 * <recordingsFolderPath>/llmaj-triage-task.json for the triage project's Sync
 * Storage to import. This is a one-time script for the triage rollout: before
 * it, the run-llmaj-evaluation route sent every judge-BAD meeting to full
 * review instead.
 *
 * planLlmajTriageBackfill in ~@meetings/tasks/llmaj-triage-backfill decides
 * which meetings qualify, going by each meeting's latest judge run at any
 * evaluator version. It skips US_DEMO, meetings whose full-review task a
 * rater annotated or skipped, meetings with a MeetingReviewOutcome, and
 * meetings that already have a triage task, so re-running the script is safe.
 *
 * With --delete-full-review-duplicates, it also deletes each backfilled
 * meeting's full-review tasks, once that meeting's triage file is written and
 * only if the task still has no annotations.
 *
 * The script prints meeting IDs, task IDs and states, and never any
 * transcript, note or person data. It refuses to run with IS_LOCAL_MODE set,
 * which would write the tasks to local disk instead of GCS.
 *
 * ## Prerequisites
 *
 * Needs the Label Studio API (LABEL_STUDIO_* env vars, with
 * LABEL_STUDIO_PROJECT_ID set to the full-review project) and Cloud SQL, via
 * the Cloud SQL Auth Proxy:
 *
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meetings
 *   # or for production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meetings
 *
 * ## Running
 *
 *   # Dry run: prints what it would write and delete, and changes nothing.
 *   nx backfill-llmaj-triage-tasks @meetings/server --configuration=production --args="--dry-run"
 *
 *   # Write triage tasks, leaving the full-review tasks in place.
 *   nx backfill-llmaj-triage-tasks @meetings/server --configuration=production
 *
 *   # Write triage tasks and delete the backfilled meetings' full-review tasks.
 *   nx backfill-llmaj-triage-tasks @meetings/server --configuration=production --args="--delete-full-review-duplicates"
 */

import { Command } from "@commander-js/extra-typings";
import { PrismaPg } from "@prisma/adapter-pg";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import { PrismaClient, StateCode } from "~@meetings/prisma/client";
import {
  exportLlmajTriageTask,
  labelStudioMeetingInclude,
} from "~@meetings/tasks";
import {
  createLabelStudioClientFromEnv,
  LabelStudioClient,
} from "~@meetings/tasks/label-studio-client";
import {
  BACKFILL_SKIP_REASONS,
  BackfillCandidate,
  BackfillSkipReason,
  groupTasksByMeetingId,
  planLlmajTriageBackfill,
} from "~@meetings/tasks/llmaj-triage-backfill";

interface ScriptArgs {
  stateCodes: StateCode[];
  projectId: number;
  since?: Date;
  dryRun: boolean;
  deleteFullReviewDuplicates: boolean;
}

/**
 * Returns a list flag's values, also splitting any comma-separated ones. nx
 * --args turns commas into argument breaks, so through nx the values have to
 * be separated by spaces.
 */
function splitList(values: string[]): string[] {
  return values
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseArgs(): ScriptArgs {
  const configuredStateCodes = MEETINGS_STATE_CODES;

  const program = new Command()
    .name("backfill-llmaj-triage-tasks")
    .description(
      "Write an LLMAJ triage task for every judge-BAD meeting still unlabeled in the full-review Label Studio project",
    )
    .option(
      "--state-codes <state-codes...>",
      `State code(s), separated by spaces (e.g. US_NE or US_NE US_PA). If omitted, uses all configured states: ${configuredStateCodes.join(", ")}`,
    )
    .option(
      "--project-id <id>",
      "Full-review Label Studio project id (default: LABEL_STUDIO_PROJECT_ID env var)",
    )
    .option(
      "--since <date>",
      "Only meetings that started on or after this date (YYYY-MM-DD, UTC)",
      (value) => {
        // A date-only ISO string parses as midnight UTC; other forms parse as
        // local time, so the format is checked first.
        const since = /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? new Date(value)
          : undefined;
        if (!since || Number.isNaN(since.getTime())) {
          console.error(`--since must be a date like 2026-09-01: ${value}`);
          process.exit(1);
        }
        return since;
      },
    )
    .option(
      "--dry-run",
      "Print what would be written and deleted, and change nothing",
    )
    .option(
      "--delete-full-review-duplicates",
      "Delete each backfilled meeting's unlabeled full-review tasks after its triage task is written",
    )
    .parse();

  const options = program.opts();

  const stateCodes = (
    options.stateCodes ? splitList(options.stateCodes) : configuredStateCodes
  ).map((code) => {
    if (!configuredStateCodes.includes(code)) {
      console.error(
        `Invalid or unconfigured state code: ${code}. Valid values: ${configuredStateCodes.join(", ")}`,
      );
      process.exit(1);
    }
    return code as StateCode;
  });

  const projectId = Number(
    options.projectId ?? process.env["LABEL_STUDIO_PROJECT_ID"],
  );
  if (!projectId) {
    console.error(
      "No Label Studio project id (pass --project-id or set LABEL_STUDIO_PROJECT_ID)",
    );
    process.exit(1);
  }

  return {
    stateCodes,
    projectId,
    since: options.since,
    dryRun: options.dryRun ?? false,
    deleteFullReviewDuplicates: options.deleteFullReviewDuplicates ?? false,
  };
}

/**
 * Writes one candidate's triage task, then, when asked, deletes its
 * full-review tasks. Returns how many tasks it deleted.
 */
async function backfillMeeting(
  prisma: PrismaClient,
  candidate: BackfillCandidate,
  ls: LabelStudioClient,
  deleteFullReviewDuplicates: boolean,
): Promise<number> {
  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: candidate.meetingId },
    include: labelStudioMeetingInclude,
  });
  const written = await exportLlmajTriageTask(
    meeting,
    candidate.evaluationRun,
    candidate.stateCode,
    candidate.gradedOutputs,
  );
  if (!written) {
    throw new Error("builder returned no task for a judge-BAD meeting");
  }
  if (!deleteFullReviewDuplicates) return 0;

  let deleted = 0;
  for (const taskId of candidate.fullReviewTaskIds) {
    // A rater may have opened the task since it was listed. A skip made since
    // then doesn't show here, and deleting that task loses nothing, because
    // the meeting now has a triage task.
    // eslint-disable-next-line no-await-in-loop
    const annotations = await ls.listAnnotationsForTask(taskId);
    if (annotations.length > 0) {
      console.log(
        `    ⚠️  Kept full-review task ${taskId}: annotated since it was listed`,
      );
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    await ls.deleteTask(taskId);
    console.log(`    🗑️  Deleted full-review task ${taskId}`);
    deleted++;
  }
  return deleted;
}

async function main(): Promise<void> {
  const { stateCodes, projectId, since, dryRun, deleteFullReviewDuplicates } =
    parseArgs();
  if (process.env["IS_LOCAL_MODE"] === "true") {
    console.error("Unset IS_LOCAL_MODE: this script writes its tasks to GCS");
    process.exit(1);
  }
  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    throw new Error("Missing DATABASE_URL_TEMPLATE environment variable");
  }

  const ls = createLabelStudioClientFromEnv();
  console.log(
    `📋 LLMAJ triage backfill${dryRun ? " (DRY RUN)" : ""}: full-review project ${projectId} at ${process.env["LABEL_STUDIO_URL"]}` +
      `${since ? `, meetings since ${since.toISOString().slice(0, 10)}` : ""}` +
      `${deleteFullReviewDuplicates ? ", deleting full-review duplicates" : ""}\n`,
  );

  const fullReviewTasks = await ls.listTasksForProject(projectId, {
    withAnnotationCounts: true,
  });
  const fullReviewTasksByMeetingId = groupTasksByMeetingId(fullReviewTasks);
  console.log(
    `Found ${fullReviewTasks.length} full-review task(s) for ${fullReviewTasksByMeetingId.size} meeting(s).\n`,
  );

  const skipCounts = new Map<BackfillSkipReason, number>();
  let candidateCount = 0;
  let writtenCount = 0;
  let deletedCount = 0;
  let errorCount = 0;

  for (const stateCode of stateCodes) {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: dbUrlTemplate.replace(
          "{state}",
          stateCode.toLowerCase(),
        ),
      }),
    });
    try {
      const { judgedMeetingCount, candidates, skipped } =
        // eslint-disable-next-line no-await-in-loop
        await planLlmajTriageBackfill(
          prisma,
          stateCode,
          fullReviewTasksByMeetingId,
          { since },
        );

      const stateSkipCounts = new Map<BackfillSkipReason, number>();
      for (const { reason } of skipped) {
        stateSkipCounts.set(reason, (stateSkipCounts.get(reason) ?? 0) + 1);
        skipCounts.set(reason, (skipCounts.get(reason) ?? 0) + 1);
      }
      console.log(
        `${stateCode}: ${judgedMeetingCount} judged meeting(s), ${candidates.length} candidate(s); skipped ${
          [...stateSkipCounts].map(([r, n]) => `${r} ${n}`).join(", ") || "none"
        }`,
      );

      for (const candidate of candidates) {
        candidateCount++;
        const label = `  ${candidate.meetingId} v${candidate.evaluationRun.evaluatorVersion} full-review task(s) ${candidate.fullReviewTaskIds.join(", ")}`;
        if (dryRun) {
          console.log(
            `${label}: would write triage task${deleteFullReviewDuplicates ? " and delete full-review task(s)" : ""}`,
          );
          continue;
        }
        try {
          // eslint-disable-next-line no-await-in-loop
          deletedCount += await backfillMeeting(
            prisma,
            candidate,
            ls,
            deleteFullReviewDuplicates,
          );
          writtenCount++;
          console.log(`${label}: ✅ wrote triage task`);
        } catch (err) {
          errorCount++;
          console.error(
            `${label}: ❌`,
            err instanceof Error ? err.message : err,
          );
        }
      }
      console.log();
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await prisma.$disconnect();
    }
  }

  console.log(`Summary: ${candidateCount} candidate(s).`);
  console.log(
    `  Skipped: ${
      BACKFILL_SKIP_REASONS.filter((r) => skipCounts.has(r))
        .map((r) => `${r} ${skipCounts.get(r)}`)
        .join(", ") || "none"
    }`,
  );
  if (dryRun) {
    console.log(
      `  Would write ${candidateCount} triage task(s)` +
        `${deleteFullReviewDuplicates ? ` and delete their full-review tasks` : ""}. Nothing changed.`,
    );
    return;
  }
  console.log(
    `  Wrote ${writtenCount} triage task(s), deleted ${deletedCount} full-review task(s), ${errorCount} error(s).`,
  );
  if (errorCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
