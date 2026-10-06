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
import { NoteSection, Prisma, StateCode } from "~@meetings/prisma/client";
import type { StructuredActionItem } from "~@meetings/tasks";
import { formatStructuredActionItem } from "~@meetings/tasks";
import {
  isFlaggedByLabelStudio,
  LS_AUTHORITATIVE_RATER_EMAIL,
  LS_TRANSCRIPT_QUALITY_FIELD_NAME,
} from "~@meetings/tasks/admin/label-studio-grades";
import { adminProcedure, router } from "~@meetings/trpc/init";
import {
  type FlaggedMeetingDetails,
  flaggedMeetingDetailsInput,
  type FlaggedMeetingSummary,
  type LabelStudioDetail,
  type LabelStudioSummary,
  listFlaggedMeetingsInput,
  type ListFlaggedMeetingsResult,
  MAX_LOOKBACK_DAYS,
  type ReviewGrade,
  type SourceName,
  type SourceStatus,
} from "~@meetings/trpc/routes/admin/flagged-meetings/flagged-meetings.schema";
import {
  combineRaterGrades,
  computeSectionFlags,
  findBadEvaluationMeetingIds,
  findCurrentOutputVotes,
  findLlmajResultsByMeeting,
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
} from "~@meetings/trpc/routes/admin/flagged-meetings/utils";
import {
  getLabelStudioSnapshot,
  type LabelStudioSnapshot,
  type LabelStudioTaskAnnotations,
} from "~@meetings/trpc/services/admin/label-studio-cache";
import { labelStudioConfig } from "~@meetings/trpc/services/admin/label-studio-config";

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
  const [evaluationIds, voteIds] = await Promise.all([
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
  ]);
  const labelStudioIds = [...(snapshot?.byMeetingId.values() ?? [])]
    .filter((entry) => entry.stateCode === stateCode)
    .filter(isFlaggedInLabelStudio)
    .map((entry) => entry.meetingId);

  const candidateIds = [
    ...new Set([...evaluationIds, ...voteIds, ...labelStudioIds]),
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

  const [llmajByMeeting, votesByMeeting] = await Promise.all([
    tracker.run(
      "evaluations",
      () =>
        findLlmajResultsByMeeting(
          prisma,
          meetings.map((m) => m.id),
        ),
      new Map<string, LlmajResult>(),
      stateCode,
    ),
    tracker.run(
      "inAppFeedback",
      () => findCurrentOutputVotes(prisma, meetings),
      new Map<string, OutputVoteRow[]>(),
      stateCode,
    ),
  ]);

  return meetings.flatMap((meeting) => {
    const llm = llmajByMeeting.get(meeting.id);
    const votes = votesByMeeting.get(meeting.id) ?? [];
    const sections = computeSectionFlags({
      llmDimensions: llm?.dimensions,
      labelStudio: snapshot?.byMeetingId.get(meeting.id),
      votes,
    });
    if (!isAnySectionFlagged(sections)) return [];

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
      ] = await Promise.all([
        findLlmajResultsByMeeting(prisma, [meeting.id]),
        findCurrentOutputVotes(prisma, [meeting]),
        resolveOriginalCaseNote(prisma, meeting),
        findSectionApprovals(prisma, meeting),
        snapshotPromise,
      ]);

      const llm = llmajByMeeting.get(meeting.id);
      const votes = votesByMeeting.get(meeting.id) ?? [];
      const lsEntry = snapshot?.byMeetingId.get(meeting.id);

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
        sections: computeSectionFlags({
          llmDimensions: llm?.dimensions,
          labelStudio: lsEntry,
          votes,
        }),
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
});
