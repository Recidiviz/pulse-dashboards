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

import type { ReviewSection } from "~@meetings/prisma/client";
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
  LS_AUTHORITATIVE_RATER_EMAIL,
  stripBlindActionItemsGrading,
  wasActionItemsGradedBlind,
} from "~@meetings/tasks/admin/label-studio-grades";
import {
  collapseLlmajTriageGrades,
  decodeLlmajTriageAnnotation,
  type LlmajTriageSectionResult,
} from "~@meetings/tasks/admin/llmaj-triage-grades";
import type {
  LabelStudioClient,
  LabelStudioTask,
} from "~@meetings/tasks/label-studio-client";
import { LLMAJ_TRIAGE_SECTIONS } from "~@meetings/tasks/label-studio-llmaj-triage";

// =============================================================================
// Cached snapshots of Label Studio projects' annotations: one for the
// full-review project, one for the LLMAJ triage project. Both projects are
// crawled the same way (list tasks, skip unannotated ones, fetch each
// annotated task's annotations) and cached the same way; only how a task's
// annotations decode into a per-meeting result differs.
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
// Snapshots are per instance. With min_instance_count = 1 and a handful of
// internal users that is fine; if it stops being fine, the shape here is
// unchanged by moving snapshots into the global database.
// =============================================================================

const TTL_MS = 60 * 60 * 1000;

/** How many per-task annotation requests are in flight at once. */
const ANNOTATION_FETCH_CONCURRENCY = 20;

type RawAnnotation = Awaited<
  ReturnType<LabelStudioClient["listAnnotationsForTask"]>
>[number];

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

export interface LlmajTriageRaterResult {
  raterEmail: string;
  annotatedAt: Date;
  updatedAt: Date;
  /** Every section this rater graded or saw, flagged or not. */
  sections: LlmajTriageSectionResult[];
}

export interface LlmajTriageTaskResult {
  taskId: number;
  meetingId: string;
  stateCode: string;
  raters: LlmajTriageRaterResult[];
  /** One result per section across raters, authoritative rater winning. */
  collapsed: Partial<Record<ReviewSection, LlmajTriageSectionResult>>;
  /** Most recent rater activity on the task, for the "recently reviewed" sort. */
  latestAnnotationAt: Date | null;
}

interface CrawlSnapshot<TTaskResult> {
  fetchedAt: Date;
  /** Annotated tasks only; a task nobody has rated yet has no entry here. */
  byMeetingId: Map<string, TTaskResult>;
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

export type LabelStudioSnapshot = CrawlSnapshot<LabelStudioTaskAnnotations>;
export type LlmajTriageSnapshot = CrawlSnapshot<LlmajTriageTaskResult> & {
  /**
   * Describes which sections were flagged by the judge at the time the triage task was
   * created.
   *
   * Once we return to only flagging BAD meetings (i.e. after the gemini 3.8 upgrade
   * resolves) this field can be removed.
   */
  sectionsFlaggedByMeetingId: Map<
    string,
    Partial<Record<ReviewSection, boolean>>
  >;
};

function taskString(task: LabelStudioTask, key: string): string | undefined {
  const value = task.data[key];
  return typeof value === "string" && value ? value : undefined;
}

function taskBoolean(task: LabelStudioTask, key: string): boolean {
  return task.data[key] === true;
}

/**
 * Returns which sections were flagged by the judge at the time the triage task was
 * created. read from the task's case_note_flagged, action_items_flagged and
 * overall_flagged fields.
 *
 * Once we return to only flagging BAD meetings (i.e. after the gemini 3.8 upgrade
 * resolves) this logic can be removed.
 */
function buildSectionsFlaggedByMeetingId(
  tasks: LabelStudioTask[],
  taskIdByMeetingId: Map<string, number>,
): Map<string, Partial<Record<ReviewSection, boolean>>> {
  const sectionsFlaggedByMeetingId = new Map<
    string,
    Partial<Record<ReviewSection, boolean>>
  >();
  for (const task of tasks) {
    const meetingId = taskString(task, "meeting_id");
    if (!meetingId || taskIdByMeetingId.get(meetingId) !== task.id) continue;
    sectionsFlaggedByMeetingId.set(
      meetingId,
      Object.fromEntries(
        LLMAJ_TRIAGE_SECTIONS.map(({ section, prefix }) => [
          section,
          taskBoolean(task, `${prefix}_flagged`),
        ]),
      ),
    );
  }
  return sectionsFlaggedByMeetingId;
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
  rawAnnotations: RawAnnotation[],
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

function buildLlmajTriageTaskResult(
  task: LabelStudioTask,
  meetingId: string,
  stateCode: string,
  config: LabelConfig,
  rawAnnotations: RawAnnotation[],
  emailById: Map<number, string>,
): LlmajTriageTaskResult | null {
  if (rawAnnotations.length === 0) return null;

  const taskFlags = {
    case_note_flagged: taskBoolean(task, "case_note_flagged"),
    action_items_flagged: taskBoolean(task, "action_items_flagged"),
    overall_flagged: taskBoolean(task, "overall_flagged"),
  };

  const raters: LlmajTriageRaterResult[] = [];
  let latestAnnotationAt: Date | null = null;

  for (const raw of rawAnnotations) {
    const raterEmail =
      emailById.get(raw.completed_by) ?? `user-${raw.completed_by}`;
    const annotatedAt = new Date(raw.created_at);
    const updatedAt = new Date(raw.updated_at);
    const decodedFields = decodeAnnotationResults(config, raw.result);
    const sections = decodeLlmajTriageAnnotation(decodedFields, taskFlags);
    raters.push({ raterEmail, annotatedAt, updatedAt, sections });

    for (const at of [annotatedAt, updatedAt]) {
      if (!latestAnnotationAt || at > latestAnnotationAt)
        latestAnnotationAt = at;
    }
  }

  return {
    taskId: task.id,
    meetingId,
    stateCode,
    raters,
    collapsed: collapseLlmajTriageGrades(raters, LS_AUTHORITATIVE_RATER_EMAIL),
    latestAnnotationAt,
  };
}

/**
 * Lists a project's tasks and fetches annotations for the ones that have any,
 * building one result per task via buildTaskResult, which is the only part
 * that differs between kinds of project.
 */
async function crawlProject<
  TTaskResult extends { meetingId: string; latestAnnotationAt: Date | null },
>(
  client: LabelStudioClient,
  projectId: number,
  buildTaskResult: (
    task: LabelStudioTask,
    meetingId: string,
    stateCode: string,
    config: LabelConfig,
    rawAnnotations: RawAnnotation[],
    emailById: Map<number, string>,
  ) => TTaskResult | null,
): Promise<{
  snapshot: CrawlSnapshot<TTaskResult>;
  tasks: LabelStudioTask[];
}> {
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
        return buildTaskResult(
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

  const byMeetingId = new Map<string, TTaskResult>();
  const latestAtByMeetingId = new Map<string, number>();
  for (const entry of entries) {
    if (!entry) continue;
    // A meeting can have more than one task (see dedupe-label-studio-tasks);
    // keep the one with the most recent rater activity.
    const latestAt = entry.latestAnnotationAt?.getTime() ?? 0;
    const existingLatest = latestAtByMeetingId.get(entry.meetingId) ?? -1;
    if (existingLatest >= latestAt) continue;
    byMeetingId.set(entry.meetingId, entry);
    latestAtByMeetingId.set(entry.meetingId, latestAt);
  }

  return {
    snapshot: {
      fetchedAt: new Date(),
      byMeetingId,
      taskIdByMeetingId,
      taskCount: tasks.length,
      annotatedTaskCount: annotatedTasks.length,
      perTaskFailures,
      unusableTaskCount,
    },
    tasks,
  };
}

// =============================================================================
// Caching. Each cache keeps one snapshot, reused for 60 minutes (TTL_MS), and
// concurrent reads share one crawl instead of starting several.
// =============================================================================

/** One Label Studio project's snapshot, cached for TTL_MS and refreshed by crawl. */
class SnapshotCache<TSnapshot extends { fetchedAt: Date }> {
  private snapshot: TSnapshot | null = null;
  private snapshotProjectId: number | null = null;
  private inFlight: Promise<TSnapshot> | null = null;
  // Bumped by invalidation so a crawl that started before a write cannot
  // store its (now stale) snapshot when it finishes.
  private generation = 0;

  constructor(
    private readonly crawl: (
      client: LabelStudioClient,
      projectId: number,
    ) => Promise<TSnapshot>,
  ) {}

  /**
   * The project's snapshot, from cache when fresh. Concurrent callers share
   * one crawl; a failed crawl rejects every waiter rather than resolving to
   * an empty snapshot that would read as "nobody has reviewed anything".
   */
  async get(
    client: LabelStudioClient,
    projectId: number,
    now: number,
  ): Promise<TSnapshot> {
    if (
      this.snapshot &&
      this.snapshotProjectId === projectId &&
      now - this.snapshot.fetchedAt.getTime() < TTL_MS
    ) {
      return this.snapshot;
    }
    if (this.inFlight) return this.inFlight;

    const startedAt = this.generation;
    this.inFlight = this.crawl(client, projectId)
      .then((snapshot) => {
        if (startedAt === this.generation) {
          this.snapshot = snapshot;
          this.snapshotProjectId = projectId;
        }
        return snapshot;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  /**
   * Drops the snapshot after this server changes Label Studio, so the next
   * read sees the change instead of waiting out the TTL. Other instances
   * still serve their own snapshot until it expires.
   */
  invalidate(): void {
    this.generation += 1;
    this.reset();
  }

  /** Empties the cache without bumping the generation. */
  reset(): void {
    this.snapshot = null;
    this.snapshotProjectId = null;
    this.inFlight = null;
  }
}

const fullReviewCache = new SnapshotCache(
  async (client, projectId): Promise<LabelStudioSnapshot> =>
    (await crawlProject(client, projectId, buildTaskAnnotations)).snapshot,
);

const llmajTriageCache = new SnapshotCache(
  async (client, projectId): Promise<LlmajTriageSnapshot> => {
    const { snapshot, tasks } = await crawlProject(
      client,
      projectId,
      buildLlmajTriageTaskResult,
    );
    return {
      ...snapshot,
      sectionsFlaggedByMeetingId: buildSectionsFlaggedByMeetingId(
        tasks,
        snapshot.taskIdByMeetingId,
      ),
    };
  },
);

export function getLabelStudioSnapshot(
  client: LabelStudioClient,
  projectId: number,
  { now = Date.now() }: { now?: number } = {},
): Promise<LabelStudioSnapshot> {
  return fullReviewCache.get(client, projectId, now);
}

export function invalidateLabelStudioSnapshot(): void {
  fullReviewCache.invalidate();
}

/** Empties the full-review cache. Only tests call this, to start each test fresh. */
export function resetLabelStudioSnapshotCache(): void {
  fullReviewCache.reset();
}

export function getLlmajTriageSnapshot(
  client: LabelStudioClient,
  projectId: number,
  { now = Date.now() }: { now?: number } = {},
): Promise<LlmajTriageSnapshot> {
  return llmajTriageCache.get(client, projectId, now);
}

/** Empties the LLMAJ triage cache. Only tests call this, to start each test fresh. */
export function resetLlmajTriageSnapshotCache(): void {
  llmajTriageCache.reset();
}
