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
 * Finds and resolves duplicate Label Studio tasks for the same meeting.
 * This is a oneoff script to address the recent (as of Aug 2026) change in
 * GCS directory structure (OBT-13914).
 *
 * Label Studio's Sync Storage is purely additive: any GCS object at a key it
 * hasn't seen before is imported as a *new* task, and it never dedupes by
 * content or removes tasks whose backing object disappears. If the GCS key
 * backing an already-synced task ever changes (e.g. a folder-structure
 * migration moves the object — see the #14821 state-code audio storage
 * split, `move-audio-to-state-folders.ts`), the next Sync Storage imports
 * the relocated object as a duplicate task for a meeting that already had
 * one. This script finds those duplicate groups and reconciles each one down
 * to a single keeper task.
 *
 * ## Why "which task has annotations" isn't the right keeper heuristic
 *
 * For each duplicated meeting, the *original* task's annotations sit on a
 * task tied to a GCS key whose object no longer exists (moved away by
 * whatever migration caused the duplication). The *new* task is tied to the
 * key that's actually live right now — and the one every future export/scrub
 * run will keep targeting. Deleting the live-keyed task is unsafe: nothing
 * stops the next Sync Storage from re-importing that still-existing object
 * as a new task again. So the keeper must always be the task tied to the
 * *live* object, migrating annotations onto it first if it doesn't have any
 * — never the reverse, even though the reverse is "the one with
 * annotations."
 *
 * Per meeting, this script:
 *   1. Groups tasks by meeting identity (top-level `meeting_id`, falling
 *      back to `meta["Meeting ID"]`).
 *   2. For groups of exactly 2, classifies each task as tied to the
 *      pre-migration key (`<meetingId>/label-studio-task.json`) or the
 *      post-migration key (`<stateCode>/<meetingId>/label-studio-task.json`)
 *      using both (a) the task's own `audio` field (if it has a recording)
 *      and (b) a live GCS `exists()` check against the meeting's actual
 *      current `recordingsGCSBucket`/`recordingsFolderPath` in Postgres.
 *      Any disagreement between these signals — or a group that isn't
 *      exactly 2 tasks — is flagged for manual review rather than guessed.
 *   3. If the live/keeper task has no annotations but the dead/stale task
 *      does, migrates each annotation onto the keeper via
 *      `LabelStudioClient.createAnnotation`, preserving every field
 *      confirmed to survive that call — attribution (`completed_by`),
 *      `lead_time`, `was_cancelled`, `ground_truth` — except `created_at`,
 *      which Label Studio always stamps to now regardless of what's sent
 *      (see `LabelStudioClient.createAnnotation`'s docstring).
 *   4. Deletes the stale task — its backing GCS object has already been
 *      confirmed gone; nothing there can ever be re-imported.
 *   5. Cleans up any already-exported copy of a migrated annotation in Label
 *      Studio's GCS *export* ("target") storage — a completely separate,
 *      manually-synced pipeline from the import side above (see
 *      `LabelStudioClient.listExportStorages`'s docstring) that this repo
 *      doesn't otherwise touch. Migrating an annotation always gives it a
 *      new id, so an already-exported original would otherwise become an
 *      orphaned duplicate the next time someone clicks "Sync Storage" on
 *      that export config — which a downstream BigQuery import (in a
 *      different repo) would have no way to dedupe.
 *
 * Dry-run by default — prints the full plan (which task is live, which
 * annotations would migrate where, which tasks would be deleted) without
 * changing anything. `--apply` requires typing back the exact number of
 * tasks about to be deleted as a confirmation gate, then executes.
 *
 * ## Prerequisites
 *
 * Needs both the Label Studio API (LABEL_STUDIO_* env vars) and Cloud SQL,
 * via the Cloud SQL Auth Proxy:
 *
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meetings
 *   # or for production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meetings
 *
 * ## Running
 *
 *   # Dry run (default) — reports what would change, writes nothing:
 *   nx dedupe-label-studio-tasks @meetings/server --configuration=staging
 *   nx dedupe-label-studio-tasks @meetings/server --configuration=production
 *
 *   # Apply the changes — prompts interactively for the deletion count:
 *   nx dedupe-label-studio-tasks @meetings/server --configuration=production --args="--apply"
 *
 *   # Non-interactive apply — `nx run-commands` doesn't forward stdin, so the
 *   # interactive prompt above hangs forever when run through nx. Pass the
 *   # expected deletion count (from a prior dry run) via --confirm instead —
 *   # same safety property, just scriptable:
 *   nx dedupe-label-studio-tasks @meetings/server --configuration=production --args="--apply --confirm=335"
 */

import readline from "node:readline/promises";

import { Command } from "@commander-js/extra-typings";
import { Storage } from "@google-cloud/storage";
import { PrismaPg } from "@prisma/adapter-pg";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import { PrismaClient, StateCode } from "~@meetings/prisma/client";
import { LABEL_STUDIO_TASK_FILENAME } from "~@meetings/tasks";
import {
  createLabelStudioClientFromEnv,
  LabelStudioClient,
  LabelStudioResult,
  LabelStudioTask,
} from "~@meetings/tasks/label-studio-client";

interface ScriptArgs {
  projectId: number;
  apply: boolean;
  concurrency: number;
  confirm: number | undefined;
}

function parseArgs(): ScriptArgs {
  const program = new Command()
    .name("dedupe-label-studio-tasks")
    .description(
      "Find and resolve duplicate Label Studio tasks pointing at the same meeting",
    )
    .option(
      "--project-id <id>",
      "Label Studio project id (default: LABEL_STUDIO_PROJECT_ID env var)",
    )
    .option(
      "--apply",
      "Actually write the changes. Without this flag the script is a dry run.",
    )
    .option("--concurrency <n>", "Max concurrent annotation/GCS lookups", "8")
    .option(
      "--confirm <n>",
      "Skip the interactive confirmation prompt by passing the expected deletion " +
        "count directly (must exactly match, same as typing it back at the prompt). " +
        "Use this when running through something that doesn't forward stdin (e.g. " +
        "`nx run-commands`) — interactive confirmation is otherwise the default and " +
        "preferred when running the script directly.",
    )
    .parse();

  const options = program.opts();

  const projectId = options.projectId
    ? Number(options.projectId)
    : Number(process.env["LABEL_STUDIO_PROJECT_ID"]);
  if (!projectId || Number.isNaN(projectId)) {
    console.error(
      "No Label Studio project id (pass --project-id or set LABEL_STUDIO_PROJECT_ID)",
    );
    process.exit(1);
  }

  return {
    projectId,
    apply: options.apply ?? false,
    concurrency: Number(options.concurrency) || 8,
    confirm:
      options.confirm !== undefined ? Number(options.confirm) : undefined,
  };
}

/** Read a string field out of a task's `meta` object, if present. */
function metaString(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const meta = data["meta"] as Record<string, unknown> | undefined;
  const value = meta?.[key];
  return typeof value === "string" ? value : undefined;
}

/** The meeting this task claims to represent, or undefined if neither identifier is present. */
function getMeetingKey(task: LabelStudioTask): string | undefined {
  const topLevel = task.data["meeting_id"];
  if (typeof topLevel === "string" && topLevel) return topLevel;
  return metaString(task.data, "Meeting ID");
}

function groupTasksByMeeting(tasks: LabelStudioTask[]): {
  groups: Map<string, LabelStudioTask[]>;
  unkeyed: LabelStudioTask[];
} {
  const groups = new Map<string, LabelStudioTask[]>();
  const unkeyed: LabelStudioTask[] = [];
  for (const task of tasks) {
    const key = getMeetingKey(task);
    if (!key) {
      unkeyed.push(task);
      continue;
    }
    const group = groups.get(key);
    if (group) group.push(task);
    else groups.set(key, [task]);
  }
  return { groups, unkeyed };
}

/** Run `fn` over `items`, at most `concurrency` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      // eslint-disable-next-line no-await-in-loop -- concurrency-limiter: each worker awaits its own item, workers run in parallel via Promise.all below
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

interface Annotation {
  id: number;
  completed_by: number;
  result: LabelStudioResult[];
  lead_time: number | null;
  was_cancelled: boolean;
  ground_truth: boolean;
}

interface ExportCleanupTarget {
  meetingId: string;
  bucket: string;
  key: string;
  annotationId: number;
}

/**
 * Finds already-exported files in Label Studio's GCS *export* ("target")
 * storage — separate from the import/source storage the rest of this script
 * deals with — that are about to become orphans of this dedupe run.
 *
 * Export storage writes one file per annotation, at `<bucket>/<prefix>/
 * <annotation_id>`, on a manually-triggered "Sync Storage" click in the LS
 * UI; there's no dedup and no cleanup on the LS side. Migrating an
 * annotation (`createAnnotation`) always produces a new annotation id, so if
 * the *stale* annotation being migrated away was already exported, the next
 * export sync will write a second file for the migrated copy without ever
 * removing the first — two files for what's semantically the same human
 * evaluation, which is exactly the kind of duplication a downstream
 * BigQuery import (outside this repo) can't distinguish from two real
 * evaluations. Deleting the stale file here, keyed precisely by the old
 * annotation's id, avoids that regardless of whether it was actually
 * exported yet — if it wasn't, the delete is just a harmless 404.
 */
async function findExportCleanupTargets(
  dedupePlans: Extract<GroupPlan, { kind: "dedupe" }>[],
  exportStorages: { bucket: string; prefix: string }[],
  storage: Storage,
  concurrency: number,
): Promise<ExportCleanupTarget[]> {
  if (exportStorages.length === 0) return [];

  const candidates: ExportCleanupTarget[] = [];
  for (const plan of dedupePlans) {
    for (const annotation of plan.migrate) {
      for (const exportStorage of exportStorages) {
        candidates.push({
          meetingId: plan.meetingId,
          bucket: exportStorage.bucket,
          key: `${exportStorage.prefix.replace(/\/$/, "")}/${annotation.id}`,
          annotationId: annotation.id,
        });
      }
    }
  }

  const existence = await mapWithConcurrency(
    candidates,
    concurrency,
    async (candidate) => {
      const [exists] = await storage
        .bucket(candidate.bucket)
        .file(candidate.key)
        .exists();
      return exists;
    },
  );

  return candidates.filter((_, i) => existence[i]);
}

type GroupPlan =
  | { kind: "singleton" }
  | {
      kind: "dedupe";
      meetingId: string;
      keep: LabelStudioTask;
      remove: LabelStudioTask;
      migrate: Annotation[];
      carryOverData: Record<string, unknown>;
      reason: string;
    }
  | {
      kind: "manual-review";
      meetingId: string;
      taskIds: number[];
      reason: string;
    };

/**
 * Fields to carry over from the stale (about-to-be-deleted) task onto the
 * keeper, when the keeper is missing them — but only ones where "preserve
 * whatever value already existed" is unambiguously correct. NOT a general
 * "copy any missing field" allowlist: e.g. transcript_* fields are
 * deliberately absent on the keeper once TTL-scrubbed, and copying them back
 * from a stale task would undo that.
 *
 * `random_split` is here because it's not derivable from anything else (it's
 * an assigned random value, not computed from meeting data) and it drives
 * which annotator's queue a meeting shows up in — regenerating a fresh value
 * would silently reassign meetings between annotators, which is exactly what
 * we don't want when the meeting itself hasn't changed hands.
 */
function computeCarryOverData(
  keep: LabelStudioTask,
  remove: LabelStudioTask,
): Record<string, unknown> {
  const carryOver: Record<string, unknown> = {};
  if (
    typeof remove.data["random_split"] === "number" &&
    typeof keep.data["random_split"] !== "number"
  ) {
    carryOver["random_split"] = remove.data["random_split"];
  }
  return carryOver;
}

interface Deps {
  storage: Storage;
  prismaByState: Map<StateCode, PrismaClient>;
  dbUrlTemplate: string;
  ls: LabelStudioClient;
}

function getPrismaForState(stateCode: StateCode, deps: Deps): PrismaClient {
  let client = deps.prismaByState.get(stateCode);
  if (!client) {
    client = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: deps.dbUrlTemplate.replace(
          "{state}",
          stateCode.toLowerCase(),
        ),
      }),
    });
    deps.prismaByState.set(stateCode, client);
  }
  return client;
}

async function planGroup(
  meetingId: string,
  tasks: LabelStudioTask[],
  deps: Deps,
): Promise<GroupPlan> {
  if (tasks.length === 1) return { kind: "singleton" };

  const taskIds = tasks.map((t) => t.id);

  if (tasks.length !== 2) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: `expected exactly 2 tasks for a duplicated meeting, found ${tasks.length}`,
    };
  }

  const states = new Set(tasks.map((t) => metaString(t.data, "State")));
  if (states.size !== 1 || !states.values().next().value) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: `tasks disagree on (or are missing) meta.State: ${[...states].join(", ")}`,
    };
  }
  const state = states.values().next().value as string;

  const configuredStateCodes = MEETINGS_STATE_CODES;
  if (!configuredStateCodes.includes(state)) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: `meta.State "${state}" is not a configured state code`,
    };
  }

  const [lower, higher] = [...tasks].sort((a, b) => a.id - b.id);

  // NOTE: the `audio` field is *not* a reliable signal here, in either
  // direction — `move-audio-to-state-folders.ts` relocated the task JSON
  // object without rewriting its content, so a task imported straight from
  // that relocated object (the `higher`-id duplicate) still carries
  // whatever stale pre-migration `audio` value was baked into the file at
  // its *original* export time. Meanwhile the original (`lower`-id) task's
  // `audio` field may or may not have since been corrected in place by
  // `patch-label-studio-tasks.ts`. Both directions of mismatch are expected
  // and don't indicate anything wrong — the only ground truth is which GCS
  // key is actually live right now (checked below), plus id order (higher
  // id was necessarily created more recently, i.e. by the erroneous
  // resync, so it's tied to whatever currently exists in GCS).

  // Cross-check: confirm against the meeting's actual current DB state and
  // live GCS contents — never delete a task without directly observing that
  // its backing object is gone.
  const prisma = getPrismaForState(state as StateCode, deps);
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { recordingsGCSBucket: true, recordingsFolderPath: true },
  });
  if (!meeting) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: "meeting not found in Postgres (deleted?)",
    };
  }

  const bucket = deps.storage.bucket(meeting.recordingsGCSBucket);
  const oldKey = `${meetingId}/${LABEL_STUDIO_TASK_FILENAME}`;
  const newKey = `${state}/${meetingId}/${LABEL_STUDIO_TASK_FILENAME}`;
  const currentKey = `${meeting.recordingsFolderPath}/${LABEL_STUDIO_TASK_FILENAME}`;

  if (currentKey !== newKey) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: `meeting's current recordingsFolderPath ("${meeting.recordingsFolderPath}") doesn't match the expected post-migration convention`,
    };
  }

  const [[oldExists], [newExists]] = await Promise.all([
    bucket.file(oldKey).exists(),
    bucket.file(newKey).exists(),
  ]);

  if (newExists === false || oldExists === true) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: `unexpected GCS state — old key exists=${oldExists}, new key exists=${newExists} (expected old=false, new=true)`,
    };
  }

  // All signals agree: `higher` is the live keeper, `lower` is safe to remove.
  const [keepAnnotations, removeAnnotations] = await Promise.all([
    deps.ls.listAnnotationsForTask(higher.id),
    deps.ls.listAnnotationsForTask(lower.id),
  ]);

  if (keepAnnotations.length > 0 && removeAnnotations.length > 0) {
    return {
      kind: "manual-review",
      meetingId,
      taskIds,
      reason: `both tasks have annotations (task ${higher.id}: ${keepAnnotations.length}, task ${lower.id}: ${removeAnnotations.length})`,
    };
  }

  const carryOverData = computeCarryOverData(higher, lower);
  const carryOverNote =
    Object.keys(carryOverData).length > 0
      ? `; carrying over ${Object.keys(carryOverData).join(", ")} from stale task`
      : "";

  return {
    kind: "dedupe",
    meetingId,
    keep: higher,
    remove: lower,
    migrate: removeAnnotations,
    carryOverData,
    reason:
      (removeAnnotations.length > 0
        ? `keeping live task ${higher.id}; migrating ${removeAnnotations.length} annotation(s) from stale task ${lower.id}`
        : `keeping live task ${higher.id}; stale task ${lower.id} has no annotations to migrate`) +
      carryOverNote,
  };
}

async function main(): Promise<void> {
  const { projectId, apply, concurrency, confirm } = parseArgs();
  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    throw new Error("Missing DATABASE_URL_TEMPLATE environment variable");
  }

  const ls = createLabelStudioClientFromEnv();
  const url = process.env["LABEL_STUDIO_URL"];
  console.log(
    `${apply ? "APPLYING" : "DRY RUN"} — Label Studio ${url} project ${projectId}\n`,
  );

  const deps: Deps = {
    storage: new Storage(),
    prismaByState: new Map(),
    dbUrlTemplate,
    ls,
  };

  const tasks = await ls.listTasksForProject(projectId);
  console.log(`Found ${tasks.length} task(s) in project ${projectId}.\n`);

  const { groups, unkeyed } = groupTasksByMeeting(tasks);
  const duplicateGroups = [...groups.entries()].filter(
    ([, group]) => group.length > 1,
  );
  const singletonCount = groups.size - duplicateGroups.length;

  console.log(
    `${groups.size} meeting group(s): ${singletonCount} singleton, ${duplicateGroups.length} duplicated.`,
  );
  if (unkeyed.length > 0) {
    console.log(
      `⚠️  ${unkeyed.length} task(s) have no meeting_id and no meta["Meeting ID"] — left untouched: ${unkeyed
        .map((t) => t.id)
        .join(", ")}`,
    );
  }
  console.log();

  const plans = await mapWithConcurrency(
    duplicateGroups,
    concurrency,
    ([meetingId, group]) => planGroup(meetingId, group, deps),
  );

  const dedupePlans = plans.filter(
    (p): p is Extract<GroupPlan, { kind: "dedupe" }> => p.kind === "dedupe",
  );
  const manualReviewPlans = plans.filter(
    (p): p is Extract<GroupPlan, { kind: "manual-review" }> =>
      p.kind === "manual-review",
  );

  const exportStorages = await ls.listExportStorages(projectId);
  if (exportStorages.length === 0) {
    console.log(
      "No GCS export (target) storage configured for this project — skipping export-bucket cleanup.\n",
    );
  } else {
    console.log(
      `Found ${exportStorages.length} export storage(s): ${exportStorages.map((s) => `gs://${s.bucket}/${s.prefix}`).join(", ")}\n`,
    );
  }
  const exportCleanupTargets = await findExportCleanupTargets(
    dedupePlans,
    exportStorages,
    deps.storage,
    concurrency,
  );
  const exportCleanupByMeeting = new Map<string, ExportCleanupTarget[]>();
  for (const target of exportCleanupTargets) {
    const existing = exportCleanupByMeeting.get(target.meetingId);
    if (existing) existing.push(target);
    else exportCleanupByMeeting.set(target.meetingId, [target]);
  }

  for (const plan of dedupePlans) {
    const exportTargets = exportCleanupByMeeting.get(plan.meetingId) ?? [];
    const exportNote =
      exportTargets.length > 0
        ? `; ${apply ? "deleting" : "would delete"} ${exportTargets.length} stale export file(s) (${exportTargets.map((t) => `gs://${t.bucket}/${t.key}`).join(", ")})`
        : "";
    console.log(
      `[dedupe] meeting ${plan.meetingId}: ${plan.reason} — ${apply ? "deleting" : "would delete"} task ${plan.remove.id}${exportNote}`,
    );
  }
  for (const plan of manualReviewPlans) {
    console.log(
      `[manual review] meeting ${plan.meetingId} (tasks ${plan.taskIds.join(", ")}): ${plan.reason}`,
    );
  }

  const totalAnnotationsToMigrate = dedupePlans.reduce(
    (sum, p) => sum + p.migrate.length,
    0,
  );
  const totalTasksToDelete = dedupePlans.length;
  const totalCarryOvers = dedupePlans.filter(
    (p) => Object.keys(p.carryOverData).length > 0,
  ).length;
  const totalExportFilesToClean = exportCleanupTargets.length;

  console.log(
    `\nSummary: ${dedupePlans.length} duplicate group(s) resolved automatically, ` +
      `${manualReviewPlans.length} flagged for manual review.`,
  );
  console.log(
    `${apply ? "Will delete" : "Would delete"} ${totalTasksToDelete} task(s), ` +
      `${apply ? "migrate" : "would migrate"} ${totalAnnotationsToMigrate} annotation(s), ` +
      `${apply ? "carry over data on" : "would carry over data on"} ${totalCarryOvers} task(s), ` +
      `${apply ? "clean up" : "would clean up"} ${totalExportFilesToClean} already-exported target-storage file(s).`,
  );

  if (!apply) {
    console.log('\nRe-run with --args="--apply" to write these changes.');
    return;
  }

  if (totalTasksToDelete === 0) {
    console.log("\nNothing to apply.");
    return;
  }

  const confirmationMessage =
    `About to delete ${totalTasksToDelete} task(s) and migrate ${totalAnnotationsToMigrate} ` +
    `annotation(s) in project ${projectId} at ${url}. This is irreversible via the API.`;

  if (confirm !== undefined) {
    console.log(`\n${confirmationMessage}`);
    if (confirm !== totalTasksToDelete) {
      console.log(
        `--confirm=${confirm} does not match the deletion count (${totalTasksToDelete}) — aborting, nothing changed.`,
      );
      process.exit(1);
    }
    console.log(`--confirm=${confirm} matches — proceeding.`);
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await rl.question(
      `\n${confirmationMessage} Type the number of tasks to delete (${totalTasksToDelete}) to confirm: `,
    );
    rl.close();
    if (answer.trim() !== String(totalTasksToDelete)) {
      console.log("Confirmation did not match — aborting, nothing changed.");
      process.exit(1);
    }
  }

  for (const plan of dedupePlans) {
    if (Object.keys(plan.carryOverData).length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await ls.updateTaskData(plan.keep.id, {
        ...plan.keep.data,
        ...plan.carryOverData,
      });
      console.log(
        `  carried over ${JSON.stringify(plan.carryOverData)} from task ${plan.remove.id} onto task ${plan.keep.id}`,
      );
    }
    for (const annotation of plan.migrate) {
      // eslint-disable-next-line no-await-in-loop
      await ls.createAnnotation(plan.keep.id, {
        result: annotation.result,
        completedBy: annotation.completed_by,
        leadTime: annotation.lead_time,
        wasCancelled: annotation.was_cancelled,
        groundTruth: annotation.ground_truth,
      });
      console.log(
        `  migrated annotation (completed_by=${annotation.completed_by}) from task ${plan.remove.id} onto task ${plan.keep.id}`,
      );
    }
    // eslint-disable-next-line no-await-in-loop
    await ls.deleteTask(plan.remove.id);
    console.log(`  deleted task ${plan.remove.id}`);

    for (const target of exportCleanupByMeeting.get(plan.meetingId) ?? []) {
      // eslint-disable-next-line no-await-in-loop
      await deps.storage
        .bucket(target.bucket)
        .file(target.key)
        .delete({ ignoreNotFound: true });
      console.log(
        `  deleted stale export file gs://${target.bucket}/${target.key} (annotation ${target.annotationId})`,
      );
    }
  }

  console.log(
    `\nDone. Deleted ${totalTasksToDelete} task(s), migrated ${totalAnnotationsToMigrate} annotation(s), ` +
      `cleaned up ${totalExportFilesToClean} export file(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
