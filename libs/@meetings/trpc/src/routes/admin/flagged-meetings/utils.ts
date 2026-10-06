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

import { TRPCError } from "@trpc/server";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import {
  ApprovalValue,
  NoteSection,
  OutputVoteTab,
  OutputVoteValue,
  Prisma,
  PrismaClient,
  ReviewSection,
  StateCode,
} from "~@meetings/prisma/client";
import {
  GRADED_DIMENSIONS,
  type GradedDimensionKey,
  type GradesByDimension,
  type HumanGrade,
  isUncoveredBadGrade,
  LS_AUTHORITATIVE_RATER_EMAIL,
  worstGrade,
} from "~@meetings/tasks/admin/label-studio-grades";
import {
  extractLlmajDimensions,
  LLMAJ_TRIGGER_KEYS,
  type LlmajDimension,
} from "~@meetings/tasks/admin/llmaj-grades";
import type { EvaluationScores } from "~@meetings/tasks/llm/evaluators";
import { DraftingOutputSchema } from "~@meetings/tasks/llm/schemas";
import {
  type CombinedGrade,
  EXCLUDED_BY_DEFAULT,
  FLAG_SECTIONS,
  type FlagSection,
  type ReopenReason,
  type ReviewOutcomeSummary,
  type SectionFlags,
  type SectionReviews,
} from "~@meetings/trpc/routes/admin/flagged-meetings/flagged-meetings.schema";
import type { LabelStudioTaskAnnotations } from "~@meetings/trpc/services/admin/label-studio-cache";
import type { AuthUser } from "~@meetings/trpc/types";

// =============================================================================
// Authorization
// =============================================================================

/**
 * The states this request may read, as the intersection of the states
 * @meetings supports, the states the caller is entitled to, and (when given)
 * the states they asked for.
 *
 * Asking for a state outside the caller's entitlement is a FORBIDDEN rather
 * than a silent drop: quietly returning fewer rows would hide a permissions
 * problem behind what looks like an empty result.
 */
export function resolveRequestedStates(
  user: Pick<AuthUser, "allowedStates">,
  requested?: StateCode[],
): StateCode[] {
  const supported = new Set<string>(MEETINGS_STATE_CODES);
  const allowed = (user.allowedStates ?? []).filter((code) =>
    supported.has(code),
  ) as StateCode[];

  if (!requested) {
    return allowed.filter((code) => !EXCLUDED_BY_DEFAULT.has(code));
  }

  const allowedSet = new Set<string>(allowed);
  const forbidden = requested.filter((code) => !allowedSet.has(code));
  if (forbidden.length > 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You do not have access to state(s): ${forbidden.join(", ")}. File a go/access request for access.`,
    });
  }
  return requested;
}

// =============================================================================
// LLMAJ evaluations
// =============================================================================

export interface LlmajResult {
  evaluatorVersion: string;
  createdAt: Date;
  evaluationTraceId: string | null;
  pipelineTraceId: string | null;
  pipelineConfigVersion: string | null;
  dimensions: LlmajDimension[];
}

/**
 * The most recent LLMAJ evaluation per meeting.
 *
 * NotetakingPipelineRun.meetingId is deliberately not a foreign key (the run
 * log outlives the meeting), so this walks meeting -> runs -> evaluations by
 * hand rather than through a relation. A meeting reprocessed several times has
 * one evaluation per run; the newest wins, matching what the app shows.
 */
export async function findLlmajResultsByMeeting(
  prisma: PrismaClient,
  meetingIds: string[],
): Promise<Map<string, LlmajResult>> {
  const byMeeting = new Map<string, LlmajResult>();
  if (meetingIds.length === 0) return byMeeting;

  const runs = await prisma.notetakingPipelineRun.findMany({
    where: { meetingId: { in: meetingIds } },
    select: {
      meetingId: true,
      langsmithTraceId: true,
      configVersion: true,
      evaluationRuns: {
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          evaluatorVersion: true,
          langsmithTraceId: true,
          scores: true,
        },
      },
    },
  });

  for (const run of runs) {
    // One evaluation per (run, evaluator version); the newest is the current
    // verdict on that run.
    const evaluation = run.evaluationRuns[0];
    if (!evaluation) continue;

    const existing = byMeeting.get(run.meetingId);
    if (existing && existing.createdAt >= evaluation.createdAt) continue;

    byMeeting.set(run.meetingId, {
      evaluatorVersion: evaluation.evaluatorVersion,
      createdAt: evaluation.createdAt,
      evaluationTraceId: evaluation.langsmithTraceId,
      pipelineTraceId: run.langsmithTraceId,
      pipelineConfigVersion: run.configVersion,
      dimensions: extractLlmajDimensions(
        evaluation.scores as unknown as EvaluationScores,
      ),
    });
  }

  return byMeeting;
}

/**
 * The meetings in the window where any evaluation run graded the case note,
 * action items or overall BAD. A superset of what the judge currently flags,
 * since a newer run can supersede a BAD one; findLlmajResultsByMeeting settles
 * that. The JSON path filter keeps the search inside the database instead of
 * loading every meeting's evaluations.
 */
export async function findBadEvaluationMeetingIds(
  prisma: PrismaClient,
  since: Date,
): Promise<string[]> {
  const runs = await prisma.notetakingEvaluationRun.findMany({
    where: {
      // An evaluation always runs after its meeting, so this bounds the scan.
      createdAt: { gte: since },
      OR: [...LLMAJ_TRIGGER_KEYS].map((key) => ({
        scores: { path: [key, "grade"], equals: "BAD" },
      })),
    },
    select: { pipelineRun: { select: { meetingId: true } } },
  });
  return [...new Set(runs.map((run) => run.pipelineRun.meetingId))];
}

// =============================================================================
// Staff thumbs up/down
// =============================================================================

/**
 * The tabs whose thumbs-down flags a section. Staff Feedback is left out: it
 * is coaching feedback for the staff member, so a vote on it says nothing
 * about the meeting's notes.
 */
export const VOTE_TAB_TO_SECTION = {
  [OutputVoteTab.DRAFT_CASE_NOTES]: "CASE_NOTE",
  [OutputVoteTab.ACTION_ITEMS]: "ACTION_ITEMS",
} as const satisfies Partial<Record<OutputVoteTab, FlagSection>>;

export const FLAGGED_VOTE_TABS = Object.keys(
  VOTE_TAB_TO_SECTION,
) as (keyof typeof VOTE_TAB_TO_SECTION)[];

export interface OutputVoteRow {
  voterEmail: string;
  vote: OutputVoteValue;
  tab: OutputVoteTab;
  message: string | null;
  createdAt: Date;
}

/**
 * Each meeting's *current* votes: the latest row per (voter, tab), scoped to
 * the meeting's current outputsPipelineRunId.
 *
 * OutputVote rows are appended, never updated, so a meeting accumulates votes
 * cast against outputs that no longer exist (it was reprocessed since). This
 * mirrors what meeting.router.ts resolves for the staff member who cast them,
 * rather than surfacing a thumbs-down against content nobody can see.
 */
export async function findCurrentOutputVotes(
  prisma: PrismaClient,
  meetings: { id: string; outputsPipelineRunId: string | null }[],
): Promise<Map<string, OutputVoteRow[]>> {
  const byMeeting = new Map<string, OutputVoteRow[]>();

  const currentRunByMeeting = new Map(
    meetings
      .filter((m) => m.outputsPipelineRunId !== null)
      .map((m) => [m.id, m.outputsPipelineRunId as string]),
  );
  if (currentRunByMeeting.size === 0) return byMeeting;

  const votes = await prisma.outputVote.findMany({
    where: {
      meetingId: { in: [...currentRunByMeeting.keys()] },
      tab: { in: [...FLAGGED_VOTE_TABS] },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const vote of votes) {
    // Cast against outputs that have since been regenerated.
    if (vote.pipelineRunId !== currentRunByMeeting.get(vote.meetingId)) {
      continue;
    }
    const existing = byMeeting.get(vote.meetingId) ?? [];
    // Ordered desc by createdAt, so the first row seen per key is the current one.
    const alreadySeen = existing.some(
      (v) =>
        v.voterEmail.toLowerCase() === vote.voterEmail.toLowerCase() &&
        v.tab === vote.tab,
    );
    if (alreadySeen) continue;
    existing.push({
      voterEmail: vote.voterEmail,
      vote: vote.vote,
      tab: vote.tab,
      message: vote.message,
      createdAt: vote.createdAt,
    });
    byMeeting.set(vote.meetingId, existing);
  }

  return byMeeting;
}

/**
 * The meetings with a thumbs-down cast since `since`. Like the evaluation
 * search, a superset: findCurrentOutputVotes drops votes cast against outputs
 * that have since been regenerated.
 */
export async function findThumbsDownMeetingIds(
  prisma: PrismaClient,
  since: Date,
): Promise<string[]> {
  const votes = await prisma.outputVote.findMany({
    where: {
      vote: OutputVoteValue.DOWN,
      tab: { in: [...FLAGGED_VOTE_TABS] },
      createdAt: { gte: since },
    },
    select: { meetingId: true },
    distinct: ["meetingId"],
  });
  return votes.map((vote) => vote.meetingId);
}

// =============================================================================
// Which section a flag lands on
// =============================================================================

export interface LabelStudioFlagInput {
  collapsed: GradesByDimension;
  /** A BAD on a field outside the graded dimensions. */
  hasUncoveredBadGrade: boolean;
}

/**
 * Which sources flag which section.
 *
 * Case note and action items map directly. Overall is flagged only when it
 * would otherwise be the only place to find the problem: an Overall BAD that
 * sits on top of a BAD case note or BAD action items adds nothing a reviewer
 * has to look at separately. The same holds for a Label Studio field outside
 * the three graded dimensions.
 */
export function computeSectionFlags({
  llmDimensions,
  labelStudio,
  votes,
}: {
  llmDimensions: LlmajDimension[] | undefined;
  labelStudio: LabelStudioFlagInput | undefined;
  votes: Pick<OutputVoteRow, "tab" | "vote">[];
}): SectionFlags {
  const llmBad = (key: "caseNote" | "actionItems" | "overall") =>
    LLMAJ_TRIGGER_KEYS.has(key) &&
    (llmDimensions ?? []).some((d) => d.key === key && d.bad);
  const lsBad = (key: GradedDimensionKey) =>
    labelStudio?.collapsed[key] === "BAD";

  const llmSectionsBad = llmBad("caseNote") || llmBad("actionItems");
  const lsSectionsBad = lsBad("caseNote") || lsBad("actionItems");

  const flags: SectionFlags = {
    CASE_NOTE: {
      llm: llmBad("caseNote"),
      labelStudio: lsBad("caseNote"),
      vote: false,
    },
    ACTION_ITEMS: {
      llm: llmBad("actionItems"),
      labelStudio: lsBad("actionItems"),
      vote: false,
    },
    OVERALL: {
      llm: llmBad("overall") && !llmSectionsBad,
      labelStudio:
        !lsSectionsBad &&
        (lsBad("overall") || labelStudio?.hasUncoveredBadGrade === true),
      vote: false,
    },
  };

  for (const { tab, vote } of votes) {
    const section =
      VOTE_TAB_TO_SECTION[tab as keyof typeof VOTE_TAB_TO_SECTION];
    if (vote === OutputVoteValue.DOWN && section) flags[section].vote = true;
  }
  return flags;
}

export function isAnySectionFlagged(flags: SectionFlags): boolean {
  return Object.values(flags).some((f) => f.llm || f.labelStudio || f.vote);
}

/**
 * How the raters' grades combine, per dimension: the authoritative rater wins
 * outright, otherwise the worst grade does. `overriddenByAuthoritative` marks
 * the case where that changes the answer, so the page can say so.
 */
export function combineRaterGrades(
  raters: { raterEmail: string; grades: GradesByDimension }[],
  collapsed: GradesByDimension,
): Record<GradedDimensionKey, CombinedGrade> {
  const result = {} as Record<GradedDimensionKey, CombinedGrade>;
  for (const { key } of GRADED_DIMENSIONS) {
    const worst: HumanGrade | null =
      worstGrade(...raters.map((r) => r.grades[key])) ?? null;
    const grade: HumanGrade | null = collapsed[key] ?? null;
    const authoritativeGraded = raters.some(
      (r) =>
        r.raterEmail.toLowerCase() ===
          LS_AUTHORITATIVE_RATER_EMAIL.toLowerCase() && r.grades[key],
    );
    result[key] = {
      grade,
      worst,
      overriddenByAuthoritative: authoritativeGraded && grade !== worst,
    };
  }
  return result;
}

// =============================================================================
// Review outcomes
// =============================================================================

/** The dimension key each section's grades are filed under, on both the judge and Label Studio sides. */
export const SECTION_TO_DIMENSION = {
  CASE_NOTE: "caseNote",
  ACTION_ITEMS: "actionItems",
  OVERALL: "overall",
} as const satisfies Record<FlagSection, GradedDimensionKey>;

export type ReviewOutcomeRow = ReviewOutcomeSummary & {
  meetingId: string;
  section: ReviewSection;
  pipelineRunId: string | null;
};

/** The meetings with an outcome recorded in the window, so a reviewed meeting stays listed after its flags clear. */
export async function findReviewedMeetingIds(
  prisma: PrismaClient,
  since: Date,
): Promise<string[]> {
  const rows = await prisma.meetingReviewOutcome.findMany({
    where: { createdAt: { gte: since } },
    select: { meetingId: true },
    distinct: ["meetingId"],
  });
  return rows.map((row) => row.meetingId);
}

/**
 * Each meeting's current outcome per section: the latest row, since outcomes
 * are appended and never updated.
 */
export async function findLatestReviewOutcomes(
  prisma: PrismaClient,
  meetingIds: string[],
): Promise<Map<string, Partial<Record<FlagSection, ReviewOutcomeRow>>>> {
  const byMeeting = new Map<
    string,
    Partial<Record<FlagSection, ReviewOutcomeRow>>
  >();
  if (meetingIds.length === 0) return byMeeting;

  const rows = await prisma.meetingReviewOutcome.findMany({
    where: { meetingId: { in: meetingIds } },
    orderBy: { createdAt: "desc" },
  });
  for (const row of rows) {
    const sections = byMeeting.get(row.meetingId) ?? {};
    // Ordered desc, so the first row seen per section is the current one.
    if (!sections[row.section]) sections[row.section] = row;
    byMeeting.set(row.meetingId, sections);
  }
  return byMeeting;
}

export interface BadEvaluationEvent {
  section: FlagSection;
  createdAt: Date;
}

/**
 * The BAD grades the judge has given each meeting's sections since `since`,
 * across every evaluation run, so a reprocess or a new evaluator version that
 * grades a reviewed section BAD again shows up even when a later run is better.
 */
export async function findBadEvaluationEvents(
  prisma: PrismaClient,
  meetingIds: string[],
  since: Date,
): Promise<Map<string, BadEvaluationEvent[]>> {
  const byMeeting = new Map<string, BadEvaluationEvent[]>();
  if (meetingIds.length === 0) return byMeeting;

  const runs = await prisma.notetakingEvaluationRun.findMany({
    where: {
      createdAt: { gt: since },
      pipelineRun: { meetingId: { in: meetingIds } },
    },
    select: {
      createdAt: true,
      scores: true,
      pipelineRun: { select: { meetingId: true } },
    },
  });
  for (const run of runs) {
    const dimensions = extractLlmajDimensions(
      run.scores as unknown as EvaluationScores,
    );
    const events = byMeeting.get(run.pipelineRun.meetingId) ?? [];
    for (const section of FLAG_SECTIONS) {
      const key = SECTION_TO_DIMENSION[section];
      if (dimensions.some((d) => d.key === key && d.bad)) {
        events.push({ section, createdAt: run.createdAt });
      }
    }
    byMeeting.set(run.pipelineRun.meetingId, events);
  }
  return byMeeting;
}

interface DatedEvent {
  at: Date;
  by: string | null;
}

function latestEvent(events: DatedEvent[]): DatedEvent | null {
  return events.reduce<DatedEvent | null>(
    (max, e) => (max === null || e.at > max.at ? e : max),
    null,
  );
}

/**
 * Where each section stands in review.
 *
 * A section with an outcome is "reviewed", unless it is still flagged and
 * something has happened since the outcome that a reviewer has not seen:
 * a Label Studio annotation created or edited with a BAD grade on the section,
 * a newer thumbs-down on its tab, a BAD evaluation, or the meeting's outputs
 * having been regenerated. That makes it "reopened", with the latest such
 * event as the reason.
 */
export function computeSectionReviews({
  flags,
  outcomes,
  outputsPipelineRunId,
  labelStudio,
  votes,
  badEvaluations,
}: {
  flags: SectionFlags;
  outcomes: Partial<Record<FlagSection, ReviewOutcomeRow>>;
  outputsPipelineRunId: string | null;
  labelStudio: Pick<LabelStudioTaskAnnotations, "annotations"> | undefined;
  votes: Pick<OutputVoteRow, "tab" | "vote" | "createdAt" | "voterEmail">[];
  badEvaluations: BadEvaluationEvent[];
}): SectionReviews {
  const reviews = {} as SectionReviews;

  for (const section of FLAG_SECTIONS) {
    const outcome = outcomes[section] ?? null;
    const flagged =
      flags[section].llm || flags[section].labelStudio || flags[section].vote;

    if (!outcome) {
      reviews[section] = {
        status: flagged ? "needs_review" : "not_flagged",
        latestOutcome: null,
        reopened: null,
      };
      continue;
    }

    const since = outcome.createdAt;
    const dimension = SECTION_TO_DIMENSION[section];
    const events: {
      reason: ReopenReason;
      at: Date | null;
      by: string | null;
    }[] = [];

    if (flagged) {
      const ls = latestEvent(
        (labelStudio?.annotations ?? [])
          .filter(
            (a) =>
              a.grades[dimension] === "BAD" ||
              (section === "OVERALL" &&
                a.decodedFields.some(isUncoveredBadGrade)),
          )
          .flatMap((a) => [
            { at: a.annotatedAt, by: a.raterEmail },
            { at: a.updatedAt, by: a.raterEmail },
          ])
          .filter((e) => e.at > since),
      );
      if (ls) events.push({ reason: "label_studio", ...ls });

      const vote = latestEvent(
        votes
          .filter(
            (v) =>
              v.vote === OutputVoteValue.DOWN &&
              VOTE_TAB_TO_SECTION[v.tab as keyof typeof VOTE_TAB_TO_SECTION] ===
                section &&
              v.createdAt > since,
          )
          .map((v) => ({ at: v.createdAt, by: v.voterEmail })),
      );
      if (vote) events.push({ reason: "thumbs_down", ...vote });

      const evaluation = latestEvent(
        badEvaluations
          .filter((e) => e.section === section && e.createdAt > since)
          .map((e) => ({ at: e.createdAt, by: null })),
      );
      if (evaluation) events.push({ reason: "evaluation", ...evaluation });

      if (outcome.pipelineRunId !== outputsPipelineRunId) {
        events.push({ reason: "outputs_regenerated", at: null, by: null });
      }
    }

    const reopened = events.reduce<(typeof events)[number] | null>(
      (best, e) =>
        best === null || (e.at?.getTime() ?? 0) > (best.at?.getTime() ?? 0)
          ? e
          : best,
      null,
    );
    reviews[section] = {
      status: reopened ? "reopened" : "reviewed",
      latestOutcome: outcome,
      reopened,
    };
  }
  return reviews;
}

// =============================================================================
// Note approvals
// =============================================================================

/**
 * When staff approved each section of the meeting's current notes, or null if
 * they have not (or approved and then unapproved). Approvals are appended and
 * scoped to a pipeline run, so only the latest row per section on the current
 * run counts.
 */
export async function findSectionApprovals(
  prisma: PrismaClient,
  meeting: { id: string; notetakingPipelineRunId: string | null },
): Promise<Record<NoteSection, Date | null>> {
  const approvals: Record<NoteSection, Date | null> = {
    [NoteSection.CASE_NOTE]: null,
    [NoteSection.ACTION_ITEMS]: null,
  };
  if (!meeting.notetakingPipelineRunId) return approvals;

  const rows = await prisma.noteApproval.findMany({
    where: {
      meetingId: meeting.id,
      pipelineRunId: meeting.notetakingPipelineRunId,
    },
    orderBy: { createdAt: "desc" },
  });
  const seen = new Set<NoteSection>();
  for (const row of rows) {
    if (seen.has(row.section)) continue;
    seen.add(row.section);
    approvals[row.section] =
      row.value === ApprovalValue.APPROVED ? row.createdAt : null;
  }
  return approvals;
}

// =============================================================================
// Meeting detail assembly
// =============================================================================

const personSelect = {
  select: { givenNames: true, surname: true, displayPersonExternalId: true },
} as const;

export const flaggedMeetingDetailInclude = {
  client: personSelect,
  resident: personSelect,
  transcriptions: {
    include: { utterances: { orderBy: { startTimeMs: "asc" as const } } },
    orderBy: { confidence: "desc" as const },
  },
  meetingActionItems: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.MeetingInclude;

export type MeetingWithDetail = Prisma.MeetingGetPayload<{
  include: typeof flaggedMeetingDetailInclude;
}>;

/**
 * Action items belonging to the run that produced the current notes, so items
 * left behind by a superseded run don't show up as pipeline output. Items staff
 * added themselves carry a null pipelineRunId and are kept.
 */
export function resolveActionItems(meeting: MeetingWithDetail) {
  return meeting.meetingActionItems.filter(
    (item) =>
      meeting.notetakingPipelineRunId === null ||
      item.pipelineRunId === null ||
      item.pipelineRunId === meeting.notetakingPipelineRunId,
  );
}

/**
 * The pre-edit generated case note, for diffing against the current one.
 *
 * Meeting.caseNote is a single mutable column overwritten in place by both
 * regeneration and staff edits — unlike MeetingActionItem's separate
 * generated/edited columns, there is no "original case note" field — so this
 * reconstructs it from the DRAFTING execution that produced it.
 * notetakingPipelineRunId only advances on reprocessing, not on a staff edit,
 * so it still points at the run whose output matches the pre-edit text.
 *
 * Null when there is nothing to diff: not edited, no pipeline run (very old
 * meetings), or no DRAFTING execution parses.
 */
export async function resolveOriginalCaseNote(
  prisma: PrismaClient,
  meeting: Pick<
    MeetingWithDetail,
    "caseNoteEditedAt" | "notetakingPipelineRunId"
  >,
): Promise<string | null> {
  if (!meeting.caseNoteEditedAt || !meeting.notetakingPipelineRunId) {
    return null;
  }
  const executions = await prisma.notetakingAgentExecution.findMany({
    where: {
      pipelineRunId: meeting.notetakingPipelineRunId,
      agentType: "DRAFTING",
    },
    orderBy: { attemptNumber: "desc" },
  });
  for (const execution of executions) {
    const parsed = DraftingOutputSchema.safeParse(execution.outputData);
    if (parsed.success) return parsed.data.caseNote;
  }
  return null;
}

/**
 * Where to listen to the meeting. The page links to the GCS console rather
 * than embedding a signed URL: whoever opens it is already signed in to a
 * Google account, and no playable link to production audio has to be minted
 * or handled.
 */
export function resolveAudioLinks(
  meeting: Pick<
    MeetingWithDetail,
    "finalRecordingGCSPath" | "audioDeletedAt" | "recordingsGCSBucket"
  >,
): { audioGsPath: string | null; audioConsoleUrl: string | null } {
  if (!meeting.finalRecordingGCSPath || meeting.audioDeletedAt) {
    return { audioGsPath: null, audioConsoleUrl: null };
  }
  return {
    audioGsPath: `gs://${meeting.recordingsGCSBucket}/${meeting.finalRecordingGCSPath}`,
    audioConsoleUrl: `https://console.cloud.google.com/storage/browser/_details/${meeting.recordingsGCSBucket}/${meeting.finalRecordingGCSPath}`,
  };
}
