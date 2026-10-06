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

import { captureException } from "@sentry/node";

import {
  decodeAnnotationResults,
  type DecodedField,
  type LabelConfig,
  parseLabelConfig,
} from "~@meetings/tasks/admin/label-studio-annotations";
import {
  collapseTaskGrades,
  decodedFieldsToGrades,
  type GradesByDimension,
  isUncoveredBadGrade,
  stripBlindActionItemsGrading,
  wasActionItemsGradedBlind,
} from "~@meetings/tasks/admin/label-studio-grades";
import type {
  LabelStudioClient,
  LabelStudioTask,
} from "~@meetings/tasks/label-studio-client";

// =============================================================================
// A cached snapshot of one Label Studio project's annotations.
//
// The crawl is slow: the task list pages 100 at a time and every annotated
// task needs its own request. Skipping tasks that report zero annotations
// keeps that to a few hundred requests rather than one per task, but it is
// still seconds rather than milliseconds, and a triage session would otherwise
// pay it again on every refetch — including React Query's refetch-on-focus.
//
// So: one snapshot per project, a TTL, and a single-flight promise so
// concurrent callers share one crawl. Deliberately not stale-while-revalidate
// — Cloud Run throttles CPU outside request handling, so a background refresh
// after the response is sent is not reliably allowed to finish.
//
// The snapshot is per instance. With min_instance_count = 1 and a handful of
// internal users that is fine; if it stops being fine, the shape here is
// unchanged by moving the snapshot into the global database.
// =============================================================================

const TTL_MS = 15 * 60 * 1000;

/** How many per-task annotation requests are in flight at once. */
const ANNOTATION_FETCH_CONCURRENCY = 20;

export interface LabelStudioAnnotation {
  raterEmail: string;
  annotatedAt: Date;
  updatedAt: Date;
  /** Every decoded field, action items included, for display. */
  decodedFields: DecodedField[];
  /** This rater's per-dimension grades, as counted toward flagging (blind action-items grades excluded). */
  grades: GradesByDimension;
  /**
   * The action-items field name when this annotation graded it blind (see
   * wasActionItemsGradedBlind) — the grade is still shown, but marked as
   * excluded so it's clear why it didn't flag the meeting. Null otherwise.
   */
  actionItemsIgnoredFieldName: string | null;
}

export interface LabelStudioTaskAnnotations {
  taskId: number;
  meetingId: string;
  stateCode: string;
  annotations: LabelStudioAnnotation[];
  /** One grade per dimension across raters, authoritative rater winning. */
  collapsed: GradesByDimension;
  /** A BAD grade on a field outside the graded dimensions, which has no override semantics. */
  hasUncoveredBadGrade: boolean;
  /** Most recent rater activity on the task, for the "recently reviewed" sort. */
  latestAnnotationAt: Date | null;
}

export interface LabelStudioSnapshot {
  fetchedAt: Date;
  /** Annotated tasks only; a task nobody has rated yet has no entry here. */
  byMeetingId: Map<string, LabelStudioTaskAnnotations>;
  /**
   * The task id of every usable task, rated or not, so a meeting that was sent
   * to Label Studio but not rated yet can be told apart from one that was
   * never sent. Where a meeting has several tasks, the newest task wins.
   */
  taskIdByMeetingId: Map<string, number>;
  /** Counts that make a partial crawl visible rather than silently short. */
  taskCount: number;
  annotatedTaskCount: number;
  perTaskFailures: number;
  /** Tasks dropped for having no usable meeting id or state in their payload. */
  unusableTaskCount: number;
}

function taskString(task: LabelStudioTask, key: string): string | undefined {
  const value = task.data[key];
  return typeof value === "string" && value ? value : undefined;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      for (;;) {
        const index = next;
        next += 1;
        if (index >= items.length) return;
        // Sequential *within* a worker is the point: `concurrency` workers run
        // in parallel, each taking the next item only once its own finishes.
        // eslint-disable-next-line no-await-in-loop
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}

function buildTaskAnnotations(
  task: LabelStudioTask,
  meetingId: string,
  stateCode: string,
  config: LabelConfig,
  rawAnnotations: {
    completed_by: number;
    result: Parameters<typeof decodeAnnotationResults>[1];
    created_at: string;
    updated_at: string;
  }[],
  emailById: Map<number, string>,
): LabelStudioTaskAnnotations | null {
  const annotations: LabelStudioAnnotation[] = [];
  const graded: { raterEmail: string; grades: GradesByDimension }[] = [];
  let hasUncoveredBadGrade = false;
  let latestAnnotationAt: Date | null = null;

  for (const raw of rawAnnotations) {
    const raterEmail =
      emailById.get(raw.completed_by) ?? `user-${raw.completed_by}`;
    const annotatedAt = new Date(raw.created_at);
    const updatedAt = new Date(raw.updated_at);
    const decodedFields = decodeAnnotationResults(config, raw.result);

    const gradedBlind = wasActionItemsGradedBlind({
      taskActionItems: task.data["action_items"],
      annotationCreatedAt: annotatedAt,
    });
    const { evaluatedFields, ignoredFromName } = gradedBlind
      ? stripBlindActionItemsGrading(decodedFields)
      : { evaluatedFields: decodedFields, ignoredFromName: null };

    const grades = decodedFieldsToGrades(evaluatedFields);
    annotations.push({
      raterEmail,
      annotatedAt,
      updatedAt,
      decodedFields,
      grades,
      actionItemsIgnoredFieldName: ignoredFromName,
    });
    graded.push({ raterEmail, grades });

    if (evaluatedFields.some(isUncoveredBadGrade)) {
      hasUncoveredBadGrade = true;
    }

    for (const at of [annotatedAt, updatedAt]) {
      if (!latestAnnotationAt || at > latestAnnotationAt)
        latestAnnotationAt = at;
    }
  }

  if (annotations.length === 0) return null;

  return {
    taskId: task.id,
    meetingId,
    stateCode,
    annotations,
    collapsed: collapseTaskGrades(graded),
    hasUncoveredBadGrade,
    latestAnnotationAt,
  };
}

async function crawl(
  client: LabelStudioClient,
  projectId: number,
): Promise<LabelStudioSnapshot> {
  const [labelConfigXml, tasks, users] = await Promise.all([
    client.getProjectLabelConfig(projectId),
    // The full field set costs a larger listing payload but reports
    // total_annotations, which is what lets the per-task fetch below skip the
    // ~two thirds of tasks nobody has annotated.
    client.listTasksForProject(projectId, { withAnnotationCounts: true }),
    client.listUsers(),
  ]);

  const config = parseLabelConfig(labelConfigXml);
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  let unusableTaskCount = 0;
  const taskIdByMeetingId = new Map<string, number>();
  const annotatedTasks = tasks.filter((task) => {
    // A task can arrive without a meeting id or state; count those rather
    // than dropping them silently.
    const meetingId = taskString(task, "meeting_id");
    const stateCode = taskString(task, "state_code");
    if (meetingId) {
      taskIdByMeetingId.set(
        meetingId,
        Math.max(task.id, taskIdByMeetingId.get(meetingId) ?? 0),
      );
    }
    if (!meetingId || !stateCode) {
      unusableTaskCount += 1;
      return false;
    }
    // Label Studio counts only completed annotations here, tallying skips
    // separately — which matches what grading uses, so a 0 really does mean
    // there is nothing to fetch.
    return (task.total_annotations ?? 0) > 0;
  });

  let perTaskFailures = 0;
  const entries = await mapWithConcurrency(
    annotatedTasks,
    ANNOTATION_FETCH_CONCURRENCY,
    async (task) => {
      try {
        const rawAnnotations = await client.listAnnotationsForTask(task.id);
        return buildTaskAnnotations(
          task,
          task.data["meeting_id"] as string,
          task.data["state_code"] as string,
          config,
          rawAnnotations,
          emailById,
        );
      } catch (e) {
        // One unreadable task must not lose the whole crawl, but it must be
        // visible: the page reports how many failed.
        perTaskFailures += 1;
        captureException(e, { tags: { labelStudioTaskId: String(task.id) } });
        return null;
      }
    },
  );

  const byMeetingId = new Map<string, LabelStudioTaskAnnotations>();
  for (const entry of entries) {
    if (!entry) continue;
    // A meeting can have more than one task (see dedupe-label-studio-tasks);
    // keep the one with the most recent rater activity.
    const existing = byMeetingId.get(entry.meetingId);
    if (
      existing &&
      (existing.latestAnnotationAt?.getTime() ?? 0) >=
        (entry.latestAnnotationAt?.getTime() ?? 0)
    ) {
      continue;
    }
    byMeetingId.set(entry.meetingId, entry);
  }

  return {
    fetchedAt: new Date(),
    byMeetingId,
    taskIdByMeetingId,
    taskCount: tasks.length,
    annotatedTaskCount: annotatedTasks.length,
    perTaskFailures,
    unusableTaskCount,
  };
}

let cached: LabelStudioSnapshot | null = null;
let cachedProjectId: number | null = null;
let inFlight: Promise<LabelStudioSnapshot> | null = null;

/**
 * The project's annotations, from cache when fresh. Concurrent callers share
 * one crawl; a failed crawl rejects every waiter rather than resolving to an
 * empty snapshot that would read as "nobody has reviewed anything".
 */
export async function getLabelStudioSnapshot(
  client: LabelStudioClient,
  projectId: number,
  { now = Date.now() }: { now?: number } = {},
): Promise<LabelStudioSnapshot> {
  if (
    cached &&
    cachedProjectId === projectId &&
    now - cached.fetchedAt.getTime() < TTL_MS
  ) {
    return cached;
  }
  if (inFlight) return inFlight;

  inFlight = crawl(client, projectId)
    .then((snapshot) => {
      cached = snapshot;
      cachedProjectId = projectId;
      return snapshot;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Test seam: drop the module-level snapshot. */
export function resetLabelStudioSnapshotCache(): void {
  cached = null;
  cachedProjectId = null;
  inFlight = null;
}
