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
 * To patch a future field, add an entry to DERIVATIONS below.
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
 * LABEL_STUDIO_PROJECT_ID / SA_KEY_FILE, all loaded from SOPS by the nx target.
 */

import { Command } from "@commander-js/extra-typings";

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
 * A top-level field to patch, and how to derive its value from a task's
 * existing `data`. Return `undefined` to skip a task (value not derivable).
 */
interface Derivation {
  field: string;
  derive: (data: Record<string, unknown>) => unknown | undefined;
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

const DERIVATIONS: Derivation[] = [
  // meeting_id was added as a top-level field after tasks were first synced.
  // Its value is the same one already surfaced in meta as "Meeting ID".
  { field: "meeting_id", derive: (data) => metaString(data, "Meeting ID") },
  // Patches the stale pre-state-split audio gs:// path (see #14821) onto
  // tasks synced before move-audio-to-state-folders.ts moved the objects.
  { field: "audio", derive: deriveMigratedAudioPath },
  // Add state_code and recording_date as top-level fields, similar to meeting_id
  { field: "state_code", derive: (data) => metaString(data, "State") },
  {
    field: "recording_date",
    derive: (data) => metaString(data, "Recording date"),
  },
];

/**
 * Compute the top-level fields that are missing or stale on a task. Returns the
 * changed key/value pairs (empty if the task is already up to date) plus any
 * derivations that couldn't be resolved.
 */
function planUpdate(task: LabelStudioTask): {
  changes: Record<string, unknown>;
  unresolved: string[];
} {
  const changes: Record<string, unknown> = {};
  const unresolved: string[] = [];
  for (const { field, derive } of DERIVATIONS) {
    const desired = derive(task.data);
    if (desired === undefined) {
      unresolved.push(field);
      continue;
    }
    if (task.data[field] !== desired) {
      changes[field] = desired;
    }
  }
  return { changes, unresolved };
}

async function main(): Promise<void> {
  const { projectId, apply } = parseArgs();
  const ls = createLabelStudioClientFromEnv();

  const url = process.env["LABEL_STUDIO_URL"];
  console.log(
    `${apply ? "APPLYING" : "DRY RUN"} — Label Studio ${url} project ${projectId}`,
  );
  console.log(
    `Patching fields: ${DERIVATIONS.map((d) => d.field).join(", ")}\n`,
  );

  const tasks = await ls.listTasksForProject(projectId);
  console.log(`Found ${tasks.length} task(s) in project ${projectId}.\n`);

  let changedCount = 0;
  let alreadyCurrent = 0;
  const skipped: { taskId: number; fields: string[] }[] = [];

  for (const task of tasks) {
    const { changes, unresolved } = planUpdate(task);

    if (unresolved.length > 0) {
      skipped.push({ taskId: task.id, fields: unresolved });
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
          `${f}: ${JSON.stringify(task.data[f])} -> ${JSON.stringify(changes[f])}`,
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
  if (skipped.length > 0) {
    console.log(
      `\n⚠️  ${skipped.length} task(s) had unresolvable field(s) (missing from meta):`,
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
