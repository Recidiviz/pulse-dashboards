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
import { TRPCError } from "@trpc/server";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import {
  NoteSection,
  Prisma,
  ReviewOutcomeKind,
  ReviewSource,
  StateCode,
} from "~@meetings/prisma/client";
import type { StructuredActionItem } from "~@meetings/tasks";
import { formatStructuredActionItem } from "~@meetings/tasks";
import {
  isFlaggedByLabelStudio,
  LS_AUTHORITATIVE_RATER_EMAIL,
  LS_TRANSCRIPT_QUALITY_FIELD_NAME,
} from "~@meetings/tasks/admin/label-studio-grades";
import type { OverrideGrade } from "~@meetings/tasks/admin/label-studio-override";
import { adminProcedure, router } from "~@meetings/trpc/init";
import {
  type FlaggedMeetingDetails,
  flaggedMeetingDetailsInput,
  type FlaggedMeetingSummary,
  type FlagSection,
  type LabelStudioDetail,
  type LabelStudioSummary,
  listFlaggedMeetingsInput,
  type ListFlaggedMeetingsResult,
  MAX_LOOKBACK_DAYS,
  recordOutcomeInput,
  type ReviewGrade,
  type SourceName,
  type SourceStatus,
} from "~@meetings/trpc/routes/admin/flagged-meetings/flagged-meetings.schema";
import {
  type BadEvaluationEvent,
  combineRaterGrades,
  computeSectionFlags,
  computeSectionReviews,
  findBadEvaluationEvents,
  findBadEvaluationMeetingIds,
  findCurrentOutputVotes,
  findLatestReviewOutcomes,
  findLlmajResultsByMeeting,
  findReviewedMeetingIds,
  findSectionApprovals,
  findThumbsDownMeetingIds,
  flaggedMeetingDetailInclude,
  isAnySectionFlagged,
  type LlmajResult,
  type OutputVoteRow,
  resolveActionItems,
  resolveAudioLinks,
  resolveOriginalCaseNote,
  resolveRequestedStates,
  type ReviewOutcomeRow,
  SECTION_TO_DIMENSION,
} from "~@meetings/trpc/routes/admin/flagged-meetings/utils";
import {
  getLabelStudioSnapshot,
  type LabelStudioSnapshot,
  type LabelStudioTaskAnnotations,
} from "~@meetings/trpc/services/admin/label-studio-cache";
import { labelStudioConfig } from "~@meetings/trpc/services/admin/label-studio-config";
import { overrideLabelStudioGrade } from "~@meetings/trpc/services/admin/label-studio-override";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Never includes the message, which can carry a query or record contents. */
function summarizeError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return `Database error ${e.code}`;
  }
  return e instanceof Error ? e.name : "Unknown error";
}

/**
 * Runs each source's work, reporting a failure instead of throwing so the
 * list can say which source failed. A failure is still loud: it goes to
 * Sentry and the server log, and the caller hides the list.
 */
class SourceTracker {
  readonly failures = new Map<SourceName, string>();

  async run<T>(
    name: SourceName,
    fn: () => Promise<T>,
    fallback: T,
    stateCode?: StateCode,
  ): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      captureException(e, { tags: { flaggedMeetingsSource: name, stateCode } });
      console.error(`Flagged meetings source "${name}" failed`, e);
      if (!this.failures.has(name)) this.failures.set(name, summarizeError(e));
      return fallback;
    }
  }

  statuses(labelStudioConfigured: boolean): SourceStatus[] {
    const names: SourceName[] = [
      "database",
      "evaluations",
      "labelStudio",
      "inAppFeedback",
    ];
    return names.map((name): SourceStatus => {
      const error = this.failures.get(name);
      if (error !== undefined) return { name, status: "failed", error };
      if (name === "labelStudio" && !labelStudioConfigured) {
        return { name, status: "not_configured" };
      }
      return { name, status: "ok" };
    });
  }
}

function labelStudioSummary(
  snapshot: LabelStudioSnapshot | null,
  meetingId: string,
): LabelStudioSummary | null {
  if (!snapshot) return null;
  const entry = snapshot.byMeetingId.get(meetingId);
  if (entry) {
    return {
      status: "rated",
      taskId: entry.taskId,
      raterCount: entry.annotations.length,
      combined: entry.collapsed,
    };
  }
  const taskId = snapshot.taskIdByMeetingId.get(meetingId);
  return taskId === undefined
    ? { status: "not_sent" }
    : { status: "not_rated", taskId };
}

function llmGrades(
  llm: LlmajResult | undefined,
): NonNullable<FlaggedMeetingSummary["llm"]>["grades"] {
  const grades: NonNullable<FlaggedMeetingSummary["llm"]>["grades"] = {};
  for (const d of llm?.dimensions ?? []) {
    if (
      d.key === "caseNote" ||
      d.key === "actionItems" ||
      d.key === "overall"
    ) {
      grades[d.key] = d.gradeOrWinner as ReviewGrade;
    }
  }
  return grades;
}

function isFlaggedInLabelStudio(entry: LabelStudioTaskAnnotations): boolean {
  return isFlaggedByLabelStudio(entry.collapsed, entry.hasUncoveredBadGrade);
}

/** The flagged meetings for one state, recording any source failure on the tracker. */
async function findFlaggedMeetingsForState({
  stateCode,
  since,
  until,
  search,
  snapshot,
  tracker,
}: {
  stateCode: StateCode;
  since: Date;
  until: Date;
  search: string | undefined;
  snapshot: LabelStudioSnapshot | null;
  tracker: SourceTracker;
}): Promise<FlaggedMeetingSummary[]> {
  const prisma = getPrismaClientForStateCode(stateCode);

  // Candidates come from the signals themselves, not from every meeting in
  // the window, so the cost follows the number of flags rather than meetings.
  const [evaluationIds, voteIds, reviewedIds] = await Promise.all([
    tracker.run(
      "evaluations",
      () => findBadEvaluationMeetingIds(prisma, since),
      [],
      stateCode,
    ),
    tracker.run(
      "inAppFeedback",
      () => findThumbsDownMeetingIds(prisma, since),
      [],
      stateCode,
    ),
    // A reviewed meeting stays listed after its flags clear.
    tracker.run(
      "database",
      () => findReviewedMeetingIds(prisma, since),
      [],
      stateCode,
    ),
  ]);
  const labelStudioIds = [...(snapshot?.byMeetingId.values() ?? [])]
    .filter((entry) => entry.stateCode === stateCode)
    .filter(isFlaggedInLabelStudio)
    .map((entry) => entry.meetingId);

  const candidateIds = [
    ...new Set([
      ...evaluationIds,
      ...voteIds,
      ...reviewedIds,
      ...labelStudioIds,
    ]),
  ];
  if (candidateIds.length === 0) return [];

  const meetings = await tracker.run(
    "database",
    () =>
      prisma.meeting.findMany({
        where: {
          id: { in: candidateIds },
          startTime: { gte: since, lte: until },
          ...(search
            ? {
                OR: [
                  { id: { contains: search, mode: "insensitive" } },
                  { staffEmail: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          startTime: true,
          staffEmail: true,
          outputsPipelineRunId: true,
        },
      }),
    [],
    stateCode,
  );
  if (meetings.length === 0) return [];

  const meetingIds = meetings.map((m) => m.id);
  const [llmajByMeeting, votesByMeeting, outcomesByMeeting] = await Promise.all(
    [
      tracker.run(
        "evaluations",
        () => findLlmajResultsByMeeting(prisma, meetingIds),
        new Map<string, LlmajResult>(),
        stateCode,
      ),
      tracker.run(
        "inAppFeedback",
        () => findCurrentOutputVotes(prisma, meetings),
        new Map<string, OutputVoteRow[]>(),
        stateCode,
      ),
      tracker.run(
        "database",
        () => findLatestReviewOutcomes(prisma, meetingIds),
        new Map<string, Partial<Record<FlagSection, ReviewOutcomeRow>>>(),
        stateCode,
      ),
    ],
  );

  const earliestOutcome = [...outcomesByMeeting.values()]
    .flatMap((sections) => Object.values(sections))
    .reduce<Date | null>(
      (min, o) => (min === null || o.createdAt < min ? o.createdAt : min),
      null,
    );
  const badEvaluationsByMeeting = earliestOutcome
    ? await tracker.run(
        "evaluations",
        () =>
          findBadEvaluationEvents(
            prisma,
            [...outcomesByMeeting.keys()],
            earliestOutcome,
          ),
        new Map<string, BadEvaluationEvent[]>(),
        stateCode,
      )
    : new Map<string, BadEvaluationEvent[]>();

  return meetings.flatMap((meeting) => {
    const llm = llmajByMeeting.get(meeting.id);
    const votes = votesByMeeting.get(meeting.id) ?? [];
    const sections = computeSectionFlags({
      llmDimensions: llm?.dimensions,
      labelStudio: snapshot?.byMeetingId.get(meeting.id),
      votes,
    });
    const outcomes = outcomesByMeeting.get(meeting.id) ?? {};
    if (!isAnySectionFlagged(sections) && Object.keys(outcomes).length === 0) {
      return [];
    }
    const reviews = computeSectionReviews({
      flags: sections,
      outcomes,
      outputsPipelineRunId: meeting.outputsPipelineRunId,
      labelStudio: snapshot?.byMeetingId.get(meeting.id),
      votes,
      badEvaluations: badEvaluationsByMeeting.get(meeting.id) ?? [],
    });

    return [
      {
        meetingId: meeting.id,
        stateCode,
        startTime: meeting.startTime,
        staffEmail: meeting.staffEmail,
        llm: llm
          ? {
              evaluatorVersion: llm.evaluatorVersion,
              createdAt: llm.createdAt,
              grades: llmGrades(llm),
            }
          : null,
        labelStudio: labelStudioSummary(snapshot, meeting.id),
        votes: votes.map(({ tab, vote }) => ({ tab, vote })),
        sections,
        reviews,
      },
    ];
  });
}

function labelStudioDetail(
  entry: LabelStudioTaskAnnotations | undefined,
  taskId: number | undefined,
  taskUrl: (taskId: number) => string,
): LabelStudioDetail | null {
  if (taskId === undefined) return null;
  const raters = (entry?.annotations ?? []).map((annotation) => ({
    raterEmail: annotation.raterEmail,
    annotatedAt: annotation.annotatedAt,
    updatedAt: annotation.updatedAt,
    isAuthoritative:
      annotation.raterEmail.toLowerCase() ===
      LS_AUTHORITATIVE_RATER_EMAIL.toLowerCase(),
    grades: annotation.grades,
    transcriptGrade:
      (annotation.decodedFields.find(
        (f) => f.fromName === LS_TRANSCRIPT_QUALITY_FIELD_NAME,
      )?.value as LabelStudioDetail["raters"][number]["transcriptGrade"]) ??
      null,
    fields: annotation.decodedFields,
    actionItemsIgnoredFieldName: annotation.actionItemsIgnoredFieldName,
  }));
  return {
    taskId,
    taskUrl: taskUrl(taskId),
    raters,
    combined: combineRaterGrades(raters, entry?.collapsed ?? {}),
  };
}

export const flaggedMeetingsRouter = router({
  list: adminProcedure
    .input(listFlaggedMeetingsInput)
    .query(async ({ ctx, input }): Promise<ListFlaggedMeetingsResult> => {
      const stateCodes = resolveRequestedStates(ctx.user, input.stateCodes);
      const until = new Date();
      const since = new Date(
        until.getTime() -
          (input.lookbackDays ?? MAX_LOOKBACK_DAYS) * MS_PER_DAY,
      );

      const tracker = new SourceTracker();
      const config = labelStudioConfig();
      const snapshot = config
        ? await tracker.run(
            "labelStudio",
            () => getLabelStudioSnapshot(config.client, config.projectId),
            null,
          )
        : null;

      const perState = await Promise.all(
        stateCodes.map((stateCode) =>
          findFlaggedMeetingsForState({
            stateCode,
            since,
            until,
            search: input.search,
            snapshot,
            tracker,
          }),
        ),
      );

      const sources = tracker.statuses(config !== null);
      // A partial list would leave flagged meetings out of the queue without
      // saying so, so any failed source hides the list entirely.
      const failed = sources.some((s) => s.status === "failed");
      return {
        sources,
        meetings: failed
          ? []
          : perState
              .flat()
              .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
      };
    }),

  getDetails: adminProcedure
    .input(flaggedMeetingDetailsInput)
    .query(async ({ ctx, input }): Promise<FlaggedMeetingDetails> => {
      // The client picks which state's database to read, so check the
      // caller's entitlement to it here.
      const [stateCode] = resolveRequestedStates(ctx.user, [input.stateCode]);
      const prisma = getPrismaClientForStateCode(stateCode);

      const meeting = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        include: flaggedMeetingDetailInclude,
      });
      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      // Not caught: a Label Studio outage should surface as an error on the
      // page rather than as a meeting that looks unrated.
      const config = labelStudioConfig();
      const snapshotPromise = config
        ? getLabelStudioSnapshot(config.client, config.projectId)
        : Promise.resolve(null);

      const [
        llmajByMeeting,
        votesByMeeting,
        caseNoteOriginal,
        approvals,
        snapshot,
        outcomesByMeeting,
      ] = await Promise.all([
        findLlmajResultsByMeeting(prisma, [meeting.id]),
        findCurrentOutputVotes(prisma, [meeting]),
        resolveOriginalCaseNote(prisma, meeting),
        findSectionApprovals(prisma, meeting),
        snapshotPromise,
        findLatestReviewOutcomes(prisma, [meeting.id]),
      ]);
      const outcomes = outcomesByMeeting.get(meeting.id) ?? {};
      const earliestOutcome = Object.values(outcomes).reduce<Date | null>(
        (min, o) => (min === null || o.createdAt < min ? o.createdAt : min),
        null,
      );
      const badEvaluations = earliestOutcome
        ? (
            await findBadEvaluationEvents(prisma, [meeting.id], earliestOutcome)
          ).get(meeting.id) ?? []
        : [];

      const llm = llmajByMeeting.get(meeting.id);
      const votes = votesByMeeting.get(meeting.id) ?? [];
      const lsEntry = snapshot?.byMeetingId.get(meeting.id);

      const sections = computeSectionFlags({
        llmDimensions: llm?.dimensions,
        labelStudio: lsEntry,
        votes,
      });

      const person = meeting.client ?? meeting.resident;
      let personType: "client" | "resident" | null = null;
      if (meeting.client) personType = "client";
      else if (meeting.resident) personType = "resident";
      const structuredActionItems = meeting.structuredActionItems as
        | StructuredActionItem[]
        | null;
      const actionItemRows = resolveActionItems(meeting);
      const bestTranscription = meeting.transcriptDeletedAt
        ? undefined
        : meeting.transcriptions[0];

      return {
        meetingId: meeting.id,
        stateCode,
        staffEmail: meeting.staffEmail,
        person: {
          type: personType,
          name: person
            ? [person.givenNames, person.surname].filter(Boolean).join(" ") ||
              null
            : null,
          displayId: person?.displayPersonExternalId ?? null,
        },
        meetingType: meeting.meetingType,
        startTime: meeting.startTime,
        durationMs: meeting.durationMs,
        audioDeletedAt: meeting.audioDeletedAt,
        transcriptDeletedAt: meeting.transcriptDeletedAt,
        audioConsoleUrl: resolveAudioLinks(meeting).audioConsoleUrl,
        llm: llm
          ? {
              evaluatorVersion: llm.evaluatorVersion,
              createdAt: llm.createdAt,
              dimensions: llm.dimensions,
            }
          : null,
        labelStudio:
          config && snapshot
            ? labelStudioDetail(
                lsEntry,
                snapshot.taskIdByMeetingId.get(meeting.id),
                (taskId) =>
                  `${config.baseUrl.replace(/\/+$/, "")}/projects/${config.projectId}/data?task=${taskId}`,
              )
            : null,
        votes: votes.map((vote) => ({
          voterEmail: vote.voterEmail,
          vote: vote.vote,
          tab: vote.tab,
          message: vote.message,
          createdAt: vote.createdAt,
        })),
        sections,
        reviews: computeSectionReviews({
          flags: sections,
          outcomes,
          outputsPipelineRunId: meeting.outputsPipelineRunId,
          labelStudio: lsEntry,
          votes,
          badEvaluations,
        }),
        outputsPipelineRunId: meeting.outputsPipelineRunId,
        caseNote: {
          current: meeting.caseNote,
          original: caseNoteOriginal,
          editedAt: meeting.caseNoteEditedAt,
          approvedAt: approvals[NoteSection.CASE_NOTE],
        },
        actionItems: {
          items: actionItemRows.map((item) => ({
            assignee: item.assignee,
            generatedTask: item.generatedTask,
            editedTask: item.editedTask,
            context: item.context,
            completed: item.completed,
            deleted: item.deleted,
            // Only pipeline output carries a run id. Meetings from before run
            // ids existed have none on any item.
            addedByStaff:
              item.pipelineRunId === null &&
              meeting.notetakingPipelineRunId !== null,
          })),
          // Only meetings processed before action items moved to their own
          // rows have these.
          legacyItems:
            actionItemRows.length > 0
              ? []
              : structuredActionItems?.map(formatStructuredActionItem) ??
                (meeting.actionItems as string[] | null) ??
                [],
          editedAt: meeting.actionItemsEditedAt,
          approvedAt: approvals[NoteSection.ACTION_ITEMS],
        },
        userNotepadNotes: meeting.userNotepadNotes,
        transcript: bestTranscription
          ? bestTranscription.utterances.map((u) => ({
              speaker: u.speaker,
              text: u.text,
              startTimeMs: u.startTimeMs,
            }))
          : null,
      };
    }),

  recordOutcome: adminProcedure
    .input(recordOutcomeInput)
    .mutation(async ({ ctx, input }) => {
      // The client picks which state's database to write to, so check the
      // caller's entitlement to it, as getDetails does.
      const [stateCode] = resolveRequestedStates(ctx.user, [input.stateCode]);
      const prisma = getPrismaClientForStateCode(stateCode);

      const meeting = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        select: { id: true, outputsPipelineRunId: true },
      });
      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      const overriddenSources =
        input.outcome === ReviewOutcomeKind.NOT_BAD
          ? [...new Set(input.overriddenSources)]
          : [];

      // Label Studio first: if it fails nothing is recorded and the reviewer
      // can retry, whereas an outcome saved without its override would say
      // something Label Studio does not. The write is idempotent, so a retry
      // after a failed save is safe.
      if (
        input.outcome === ReviewOutcomeKind.NOT_BAD &&
        overriddenSources.includes(ReviewSource.LABEL_STUDIO)
      ) {
        const config = labelStudioConfig();
        if (!config) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Label Studio is not configured in this environment",
          });
        }
        const snapshot = await getLabelStudioSnapshot(
          config.client,
          config.projectId,
        );
        const taskId = snapshot.taskIdByMeetingId.get(meeting.id);
        if (taskId === undefined) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This meeting has no Label Studio task to override",
          });
        }
        await overrideLabelStudioGrade({
          client: config.client,
          projectId: config.projectId,
          taskId,
          dimension: SECTION_TO_DIMENSION[input.section],
          grade: input.correctedGrade as OverrideGrade,
        });
      }

      await prisma.meetingReviewOutcome.create({
        data: {
          meetingId: meeting.id,
          section: input.section,
          pipelineRunId: meeting.outputsPipelineRunId,
          outcome: input.outcome,
          followUp:
            input.outcome === ReviewOutcomeKind.OTHER ? null : input.followUp,
          correctedGrade:
            input.outcome === ReviewOutcomeKind.NOT_BAD
              ? input.correctedGrade
              : null,
          overriddenSources,
          appliesTo: input.appliesTo ?? [],
          notes: input.notes ?? null,
          reviewerEmail: ctx.user.email,
        },
      });

      // The meeting id only: the audit line must not carry record contents.
      console.info("Flagged meeting review outcome recorded", {
        meetingId: meeting.id,
        stateCode,
        section: input.section,
        outcome: input.outcome,
        labelStudioOverridden: overriddenSources.includes(
          ReviewSource.LABEL_STUDIO,
        ),
      });
    }),
});
