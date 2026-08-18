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
 * Patches top-level fields onto existing Label Studio tasks in place.
 *
 * When the export shape (buildLabelStudioTask) changes shape, grows a new top-level field, tasks
 * already synced into Label Studio don't get it. Re-syncing from GCS only adds new task files- it
 * doesn't modify ones that have already been synced, so we need to use the Label Studio API to make
 * these modifications.
 *
 * To patch a future field, add an entry to DERIVATIONS below (or to
 * buildDerivations, for a field whose value has to come from the database).
 *
 * A derivation can also decline to touch a given task, with a reason tallied in
 * the run summary — action_items skips tasks that are already graded or already
 * populated.
 *
 * ## Prerequisites
 *
 * Derivations that read the meetings databases need the Cloud SQL Auth Proxy
 * running, same as export-label-studio-tasks.ts:
 *
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meetings
 *   # or for production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meetings
 *
 * ## Running
 *
 *   # Dry run (default) — reports what would change, writes nothing:
 *   nx patch-label-studio-tasks @meetings/server --configuration=staging nx
 *   patch-label-studio-tasks @meetings/server --configuration=production
 *
 *   # Apply the changes:
 *   nx patch-label-studio-tasks @meetings/server --configuration=production --args="--apply"
 *
 * Requires LABEL_STUDIO_URL / LABEL_STUDIO_API_TOKEN / LABEL_STUDIO_IAP_AUDIENCE /
 * LABEL_STUDIO_PROJECT_ID / SA_KEY_FILE / DATABASE_URL_TEMPLATE, all loaded from
 * SOPS by the nx target.
 */

import { Command } from "@commander-js/extra-typings";
import { PrismaPg } from "@prisma/adapter-pg";
import { isEqual } from "lodash";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import { Prisma, PrismaClient, StateCode } from "~@meetings/prisma/client";
import {
  formatLabelStudioActionItems,
  labelStudioActionItemsSelect,
} from "~@meetings/tasks/label-studio";
import {
  createLabelStudioClientFromEnv,
  type LabelStudioTask,
} from "~@meetings/tasks/label-studio-client";

interface ScriptArgs {
  projectId: number;
  apply: boolean;
}

function parseArgs(): ScriptArgs {
  const program = new Command()
    .name("patch-label-studio-tasks")
    .description(
      "Patch top-level fields onto existing Label Studio tasks in place (annotations preserved)",
    )
    .option(
      "--project-id <id>",
      "Label Studio project id (default: LABEL_STUDIO_PROJECT_ID env var)",
    )
    .option(
      "--apply",
      "Actually write the changes. Without this flag the script is a dry run.",
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

  return { projectId, apply: options.apply ?? false };
}

/**
 * A derivation's decision to leave a field alone, as distinct from `undefined`
 * (couldn't derive it — report the task for follow-up). The reason is tallied
 * in the run summary.
 */
interface LeaveUnchanged {
  readonly leaveUnchanged: true;
  readonly reason: string;
}

function leaveUnchanged(reason: string): LeaveUnchanged {
  return { leaveUnchanged: true, reason };
}

function isLeaveUnchanged(value: unknown): value is LeaveUnchanged {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as LeaveUnchanged).leaveUnchanged === true
  );
}

/**
 * A top-level field to patch, and how to derive its value for a task. Return
 * `undefined` if it isn't derivable, or `leaveUnchanged(reason)` to leave this
 * task's field as it is. See buildDerivations for the database-backed ones.
 */
interface Derivation {
  field: string;
  derive: (task: LabelStudioTask) => unknown | LeaveUnchanged;
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

/** Parse a `gs://<bucket>/<objectPath>` URI. */
function parseGsUri(
  uri: string,
): { bucket: string; objectPath: string } | undefined {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!match) return undefined;
  const [, bucket, objectPath] = match;
  return { bucket, objectPath };
}

/**
 * Extract the underlying `gs://` URI a task's `audio` field points at.
 *
 * A freshly-exported task (see `buildLabelStudioTask`) stores the raw
 * `gs://` URI directly. Once Label Studio resolves that field against its
 * Cloud Storage source — which happens as soon as the task is loaded, and
 * persists thereafter — the API instead returns a proxy URL of the form
 * `<host>/tasks/<id>/resolve/?fileuri=<base64(gs://...)>`, with the original
 * URI base64-encoded in the `fileuri` query param. This handles both shapes.
 */
function extractGsUri(value: string): string | undefined {
  if (value.startsWith("gs://")) return value;

  try {
    const fileuri = new URL(value).searchParams.get("fileuri");
    if (!fileuri) return undefined;
    const decoded = Buffer.from(fileuri, "base64").toString("utf8");
    return decoded.startsWith("gs://") ? decoded : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Patches the `audio` field on an already-exported Label Studio task
 * (see `buildLabelStudioTask`) to match the state-code-prefixed GCS path
 * introduced by the audio storage migration (#14821).
 *
 * Pre-migration audio paths were `<meetingId>/...`; post-migration
 * (`move-audio-to-state-folders.ts`) they're `<stateCode>/<meetingId>/...`.
 * Tasks synced before that migration ran still carry the stale
 * pre-migration `gs://` URI even though the underlying GCS object was
 * physically moved out from under it — whether that URI is still raw or
 * Label Studio has since rewritten it to a resolved proxy URL (see
 * `extractGsUri`). The replacement is always written back as a raw `gs://`
 * URI, matching what a fresh export produces; Label Studio re-proxies it the
 * next time the task is loaded.
 *
 * Returns `undefined` (unresolvable) only when the task's audio clearly
 * still needs migrating but the state code can't be determined from its
 * `meta`, so the caller can flag it for manual follow-up.
 */
function deriveMigratedAudioPath(
  data: Record<string, unknown>,
): unknown | undefined {
  const audio = data["audio"];
  if (typeof audio !== "string") return audio; // null/missing — no recording, no-op

  const gsUri = extractGsUri(audio);
  if (!gsUri) return audio; // not a gs:// URI (raw or resolved) we understand — leave as-is

  const parsed = parseGsUri(gsUri);
  if (!parsed) return audio; // malformed — leave as-is

  const meetingId = metaString(data, "Meeting ID");
  if (!meetingId || !parsed.objectPath.startsWith(`${meetingId}/`)) {
    return audio; // already migrated, or doesn't match the old convention — no-op
  }

  const state = metaString(data, "State");
  if (!state) return undefined; // stale shape but state undeterminable — flag for manual follow-up

  return `gs://${parsed.bucket}/${state}/${parsed.objectPath}`;
}

/** Derivations whose value comes from the task's own `data`. */
const DERIVATIONS: Derivation[] = [
  // meeting_id was added as a top-level field after tasks were first synced.
  // Its value is the same one already surfaced in meta as "Meeting ID".
  {
    field: "meeting_id",
    derive: ({ data }) => metaString(data, "Meeting ID"),
  },
  // Patches the stale pre-state-split audio gs:// path (see #14821) onto
  // tasks synced before move-audio-to-state-folders.ts moved the objects.
  { field: "audio", derive: ({ data }) => deriveMigratedAudioPath(data) },
  // Add state_code and recording_date as top-level fields, similar to meeting_id
  { field: "state_code", derive: ({ data }) => metaString(data, "State") },
  {
    field: "recording_date",
    derive: ({ data }) => metaString(data, "Recording date"),
  },
];

/**
 * A task's (state, meeting) identity, falling back to `meta` for tasks synced
 * before those top-level fields existed. Undefined if either is missing, or if
 * the state isn't one @meetings has a database for.
 */
function taskMeetingRef(
  data: Record<string, unknown>,
): { stateCode: StateCode; meetingId: string } | undefined {
  const meetingId =
    typeof data["meeting_id"] === "string"
      ? data["meeting_id"]
      : metaString(data, "Meeting ID");
  const stateCode =
    typeof data["state_code"] === "string"
      ? data["state_code"]
      : metaString(data, "State");
  if (!meetingId || !stateCode || !MEETINGS_STATE_CODES.includes(stateCode)) {
    return undefined;
  }
  return { stateCode: stateCode as StateCode, meetingId };
}

/** Map key for the meeting lookup below (meeting ids are unique per state). */
function meetingRefKey(stateCode: StateCode, meetingId: string): string {
  return `${stateCode}:${meetingId}`;
}

/** What database-backed derivations get per meeting; widen as they need more. */
const PATCH_MEETING_SELECT = {
  id: true,
  ...labelStudioActionItemsSelect,
} satisfies Prisma.MeetingSelect;

type PatchMeeting = Prisma.MeetingGetPayload<{
  select: typeof PATCH_MEETING_SELECT;
}>;

/**
 * Load every meeting the tasks point at, one query per state database. Meetings
 * that no longer exist are absent from the map, which leaves their task's
 * database-backed fields unresolved rather than derived from nothing.
 */
async function fetchMeetingsForTasks(
  tasks: LabelStudioTask[],
  dbUrlTemplate: string,
): Promise<Map<string, PatchMeeting>> {
  const meetingIdsByState = new Map<StateCode, Set<string>>();
  for (const task of tasks) {
    const ref = taskMeetingRef(task.data);
    if (!ref) continue;
    const ids = meetingIdsByState.get(ref.stateCode) ?? new Set<string>();
    ids.add(ref.meetingId);
    meetingIdsByState.set(ref.stateCode, ids);
  }

  const meetingsByRef = new Map<string, PatchMeeting>();
  for (const [stateCode, meetingIds] of meetingIdsByState) {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: dbUrlTemplate.replace(
          "{state}",
          stateCode.toLowerCase(),
        ),
      }),
    });
    try {
      // eslint-disable-next-line no-await-in-loop
      const meetings = await prisma.meeting.findMany({
        where: { id: { in: [...meetingIds] } },
        select: PATCH_MEETING_SELECT,
      });
      for (const meeting of meetings) {
        meetingsByRef.set(meetingRefKey(stateCode, meeting.id), meeting);
      }
      console.log(
        `  ${stateCode}: ${meetings.length} of ${meetingIds.size} meeting(s) found`,
      );
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await prisma.$disconnect();
    }
  }
  return meetingsByRef;
}

/**
 * Whether a task has a *completed* annotation, or undefined if it wasn't listed with annotation
 * counts. `total_annotations` does not count tasks with a "skipped" annotation (which for our
 * purposes are equivalent to ones that have no annotations)
 */
function hasCompleteAnnotation(task: LabelStudioTask): boolean | undefined {
  return task.total_annotations === undefined
    ? undefined
    : task.total_annotations > 0;
}

function isEmptyActionItems(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  // Action Items have been both strings and lists at points in time, so check emptiness for both.
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** The data-only derivations above, plus the ones that read `meetingsByRef`. */
function buildDerivations(
  meetingsByRef: Map<string, PatchMeeting>,
): Derivation[] {
  /** The meeting a task points at, or undefined if it isn't in the map. */
  const meetingForTask = (task: LabelStudioTask): PatchMeeting | undefined => {
    const ref = taskMeetingRef(task.data);
    return ref
      ? meetingsByRef.get(meetingRefKey(ref.stateCode, ref.meetingId))
      : undefined;
  };

  return [
    ...DERIVATIONS,
    // Tasks synced while buildLabelStudioTask still read the deprecated
    // structuredActionItems column have `action_items: null`, so raters were
    // grading action items they couldn't see. Fill that gap and fix formatting.
    {
      field: "action_items",
      derive: (task) => {
        // Filling this in after someone graded it would change what they were
        // looking at, so leave graded tasks alone.
        const graded = hasCompleteAnnotation(task);
        if (graded === undefined) return undefined;
        if (graded) {
          return leaveUnchanged("task already has a completed annotation");
        }

        const current = task.data["action_items"];

        if (Array.isArray(current) && current.length > 0) {
          return current.join("\n");
        }

        // Any other non-empty value is already a string of the right shape.
        if (!isEmptyActionItems(current)) {
          return leaveUnchanged("task already has action items");
        }

        const meeting = meetingForTask(task);
        if (!meeting) return undefined;

        const actionItems = formatLabelStudioActionItems(meeting);
        return actionItems ?? leaveUnchanged("meeting has no action items");
      },
    },
  ];
}

/**
 * The fields that are missing or stale on a task: the changed key/value pairs
 * (empty if it's up to date), plus the derivations that couldn't resolve and
 * the ones that declined.
 */
function planUpdate(
  task: LabelStudioTask,
  derivations: Derivation[],
): {
  changes: Record<string, unknown>;
  unresolved: string[];
  leftUnchanged: { field: string; reason: string }[];
} {
  const changes: Record<string, unknown> = {};
  const unresolved: string[] = [];
  const leftUnchanged: { field: string; reason: string }[] = [];
  for (const { field, derive } of derivations) {
    const desired = derive(task);
    if (isLeaveUnchanged(desired)) {
      leftUnchanged.push({ field, reason: desired.reason });
      continue;
    }
    if (desired === undefined) {
      unresolved.push(field);
      continue;
    }
    if (!isEqual(task.data[field], desired)) {
      changes[field] = desired;
    }
  }
  return { changes, unresolved, leftUnchanged };
}

/** Compact one value for the per-task log line, so array fields stay readable. */
function formatValueForLog(value: unknown): string {
  if (!Array.isArray(value)) return JSON.stringify(value);
  if (value.length === 0) return "[]";
  const first = JSON.stringify(value[0]);
  const preview = first.length > 60 ? `${first.slice(0, 60)}…` : first;
  return `[${value.length} item(s), first: ${preview}]`;
}

async function main(): Promise<void> {
  const { projectId, apply } = parseArgs();
  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    console.error(
      "Missing DATABASE_URL_TEMPLATE environment variable — the action_items derivation reads the meetings databases.\n" +
        "Add it to env.patch-label-studio-tasks.<env>.enc.yaml (copy the value from env.export-label-studio-tasks.<env>.enc.yaml).",
    );
    process.exit(1);
  }
  const ls = createLabelStudioClientFromEnv();

  const url = process.env["LABEL_STUDIO_URL"];
  console.log(
    `${apply ? "APPLYING" : "DRY RUN"} — Label Studio ${url} project ${projectId}`,
  );

  const tasks = await ls.listTasksForProject(projectId, {
    // access annotation counts so derivations can skip already-graded tasks
    withAnnotationCounts: true,
  });
  const gradedCount = tasks.filter((t) => hasCompleteAnnotation(t)).length;
  console.log(
    `Found ${tasks.length} task(s) in project ${projectId}, ${gradedCount} of them with a completed annotation.\n`,
  );

  console.log("Looking up meetings per state:");
  const derivations = buildDerivations(
    await fetchMeetingsForTasks(tasks, dbUrlTemplate),
  );
  console.log(
    `\nPatching fields: ${derivations.map((d) => d.field).join(", ")}\n`,
  );

  let changedCount = 0;
  let alreadyCurrent = 0;
  const skipped: { taskId: number; fields: string[] }[] = [];
  const leftUnchangedCounts = new Map<string, number>();

  for (const task of tasks) {
    const { changes, unresolved, leftUnchanged } = planUpdate(
      task,
      derivations,
    );

    if (unresolved.length > 0) {
      skipped.push({ taskId: task.id, fields: unresolved });
    }
    for (const { field, reason } of leftUnchanged) {
      const key = `${field}: ${reason}`;
      leftUnchangedCounts.set(key, (leftUnchangedCounts.get(key) ?? 0) + 1);
    }

    const changedFields = Object.keys(changes);
    if (changedFields.length === 0) {
      if (unresolved.length === 0) alreadyCurrent += 1;
      continue;
    }

    changedCount += 1;
    const summary = changedFields
      .map(
        (f) =>
          `${f}: ${formatValueForLog(task.data[f])} -> ${formatValueForLog(changes[f])}`,
      )
      .join(", ");
    console.log(
      `${apply ? "updating" : "would update"} task ${task.id}: ${summary}`,
    );

    if (apply) {
      // eslint-disable-next-line no-await-in-loop
      await ls.updateTaskData(task.id, { ...task.data, ...changes });
    }
  }

  console.log(
    `\n${apply ? "Updated" : "Would update"} ${changedCount} task(s). ${alreadyCurrent} already current.`,
  );
  for (const [fieldAndReason, count] of leftUnchangedCounts) {
    console.log(
      `${count} task(s) left unchanged on purpose — ${fieldAndReason}`,
    );
  }
  if (skipped.length > 0) {
    console.log(
      `\n⚠️  ${skipped.length} task(s) had unresolvable field(s) (missing from meta, or meeting no longer in the database):`,
    );
    for (const s of skipped) {
      console.log(`   task ${s.taskId}: ${s.fields.join(", ")}`);
    }
  }
  if (!apply) {
    console.log('\nRe-run with --args="--apply" to write these changes.');
  }
}

main();
