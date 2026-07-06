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

import path from "node:path";

import { captureException } from "@sentry/node";
import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { z } from "zod";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import {
  ApprovalValue,
  NoteSection,
  OutputVoteTab,
  OutputVoteValue,
  PostMeetingProcessingStatus,
  Prisma,
} from "~@meetings/prisma/client";
import {
  deleteRecordingFiles,
  getSignedUrlForNewRecording,
  getSignedUrlForRecording,
  MinuteSectionSchema,
  StaffFeedbackOutputSchema,
} from "~@meetings/tasks";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import { deriveValidationErrorType } from "~@meetings/trpc/routes/meeting.helpers";
import {
  approveSectionInputSchema,
  createSignedUrlForRecordingInputSchema,
  deleteRecordingsInputSchema,
  discardMeetingInputSchema,
  endMeetingInputSchema,
  getDetailInputSchema,
  getDetailsOutputSchema,
  submitOutputVoteInputSchema,
  submitOutputVoteMessageInputSchema,
  updateNotesInputSchema,
} from "~@meetings/trpc/routes/meeting/meeting.schema";
import { queueStitchingTask } from "~@meetings/trpc/routes/meeting/utils";

export const meetingRouter = router({
  getDetails: auth0Procedure
    .input(getDetailInputSchema)
    .output(getDetailsOutputSchema)
    .query(
      async ({ input: { meetingId }, ctx: { prisma, stateCode, user } }) => {
        try {
          const meeting = await prisma.meeting.findUniqueOrThrow({
            where: { id: meetingId },
            select: {
              id: true,
              startTime: true,
              endTime: true,
              caseNote: true,
              userNotepadNotes: true,
              actionItems: true,
              criticalUpdates: true,
              meetingSummary: true,
              staffFeedback: true,
              staffFeedbackGeneratedAt: true,
              outputsPipelineRunId: true,
              notetakingPipelineRunId: true,
              caseNoteEditedAt: true,
              actionItemsEditedAt: true,
              postMeetingProcessingStatus: true,
              durationMs: true,
              recordingsFolderPath: true,
              transcriptDeletedAt: true,
              staffEmail: true,
              recordingsGCSBucket: true,
              finalRecordingGCSPath: true,
              audioDeletedAt: true,
              meetingType: true,
              meetingTypeCategory: true,
              meetingActionItems: {
                where: { deleted: false },
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  assignee: true,
                  completed: true,
                  editedTask: true,
                  generatedTask: true,
                  context: true,
                  evidenceQuotes: true,
                  deleted: true,
                  pipelineRunId: true,
                },
              },
              transcriptions: {
                orderBy: {
                  confidence: "desc",
                },
                take: 1,
                select: {
                  confidence: true,
                  summary: true,
                  utterances: {
                    orderBy: {
                      startTimeMs: "asc",
                    },
                    select: {
                      confidence: true,
                      text: true,
                      speaker: true,
                      startTimeMs: true,
                      endTimeMs: true,
                    },
                  },
                },
              },
            },
          });

          // Validate and parse JSON fields
          const validateJsonField = <T>(
            fieldValue: unknown,
            schema: z.ZodType<T>,
          ): T | null => {
            if (!fieldValue) return null;
            try {
              return schema.parse(fieldValue);
            } catch (error) {
              console.error("Failed to validate JSON field:", error);
              return null;
            }
          };

          const latestPipelineRun =
            await prisma.notetakingPipelineRun.findFirst({
              where: { meetingId },
              orderBy: { createdAt: "desc" },
              select: { status: true, errorDetails: true },
            });

          const pipelineValidationErrorType = deriveValidationErrorType(
            latestPipelineRun?.errorDetails,
          );

          const stateConfig = AGENCY_CONFIGS[stateCode];

          const includeTranscription = stateConfig?.showTranscriptions ?? true;
          const supportsAudioPlayback =
            stateConfig?.audioPlaybackEnabled ?? false;
          const staffFeedbackEnabled =
            stateConfig?.staffFeedbackEnabled ?? false;

          const parsedStaffFeedback = staffFeedbackEnabled
            ? validateJsonField(
                meeting.staffFeedback,
                StaffFeedbackOutputSchema,
              )
            : null;
          const staffFeedback =
            parsedStaffFeedback && meeting.staffFeedbackGeneratedAt
              ? {
                  ...parsedStaffFeedback,
                  generatedAt: meeting.staffFeedbackGeneratedAt,
                }
              : null;

          // Find the user's most-recent vote tied to this exact feedback content
          // version (the pipeline run that produced it). Older votes (against
          // prior runs) are ignored so the UI shows no current vote when
          // feedback is reprocessed.
          const currentOutputVotes = meeting.outputsPipelineRunId
            ? (
                await prisma.outputVote.findMany({
                  where: {
                    meetingId,
                    voterEmail: user.email,
                    pipelineRunId: meeting.outputsPipelineRunId,
                  },
                  orderBy: { createdAt: "desc" },
                  select: { vote: true, tab: true, message: true },
                })
              ).reduce<
                Partial<
                  Record<
                    OutputVoteTab,
                    {
                      vote: OutputVoteValue;
                      message: string | null;
                    }
                  >
                >
              >((acc, { tab, ...rest }) => {
                const skip =
                  tab === OutputVoteTab.STAFF_FEEDBACK && !staffFeedbackEnabled;
                if (!acc[tab] && !skip) {
                  acc[tab] = rest;
                }
                return acc;
              }, {})
            : null;

          const audioUrl =
            supportsAudioPlayback &&
            meeting.finalRecordingGCSPath &&
            !meeting.audioDeletedAt
              ? await getSignedUrlForRecording(
                  meeting.recordingsFolderPath,
                  meeting.recordingsGCSBucket,
                  path.basename(meeting.finalRecordingGCSPath),
                )
              : null;

          // Latest approval per section for the current run; id tiebreaks equal timestamps.
          const approvalRows = meeting.notetakingPipelineRunId
            ? await prisma.noteApproval.findMany({
                where: {
                  meetingId,
                  pipelineRunId: meeting.notetakingPipelineRunId,
                },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                select: { section: true, value: true },
              })
            : [];

          const latestApprovalBySection = new Map<NoteSection, ApprovalValue>();
          for (const row of approvalRows) {
            if (!latestApprovalBySection.has(row.section)) {
              latestApprovalBySection.set(row.section, row.value);
            }
          }
          const isApproved = (section: NoteSection) =>
            latestApprovalBySection.get(section) === ApprovalValue.APPROVED;

          const currentActionItems = meeting.meetingActionItems.filter(
            (item) => item.pipelineRunId === meeting.notetakingPipelineRunId,
          );

          return {
            ..._.omit(meeting, [
              "transcriptions",
              "meetingActionItems",
              "staffFeedback",
              "staffFeedbackGeneratedAt",
              "outputsPipelineRunId",
              "notetakingPipelineRunId",
              "recordingsGCSBucket",
              "finalRecordingGCSPath",
              "audioDeletedAt",
            ]),
            actionItems:
              validateJsonField(meeting.actionItems, z.array(z.string())) || [],
            meetingActionItems: currentActionItems.map((item) =>
              _.omit(item, ["pipelineRunId"]),
            ),
            structuredActionItems: currentActionItems.map((item) => ({
              task: item.editedTask ?? item.generatedTask,
              context: item.context ?? null,
              evidenceQuotes:
                item.evidenceQuotes.length > 0 ? item.evidenceQuotes : null,
            })),
            criticalUpdates:
              validateJsonField(meeting.criticalUpdates, z.array(z.string())) ||
              [],
            meetingSummary:
              validateJsonField(
                meeting.meetingSummary,
                MinuteSectionSchema.array(),
              ) || [],
            staffFeedback,
            currentOutputVotes: _.isEmpty(currentOutputVotes)
              ? null
              : currentOutputVotes,
            approvals: {
              caseNote: isApproved(NoteSection.CASE_NOTE),
              actionItems: isApproved(NoteSection.ACTION_ITEMS),
            },
            transcription: includeTranscription
              ? meeting.transcriptions[0] || null
              : undefined,
            validationErrorType: pipelineValidationErrorType,
            audioUrl,
          };
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Meeting with that id was not found",
              cause: e,
            });
          }

          throw e;
        }
      },
    ),
  createSignedUrlForRecording: auth0Procedure
    .input(createSignedUrlForRecordingInputSchema)
    .mutation(
      async ({
        input: { meetingId, contentType, fileExtension },
        ctx: { prisma },
      }) => {
        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
        });

        if (!meeting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
          });
        }

        return await getSignedUrlForNewRecording(
          meeting.recordingsGCSBucket,
          meeting.recordingsFolderPath,
          fileExtension,
          contentType,
        );
      },
    ),
  deleteRecordings: auth0Procedure
    .input(deleteRecordingsInputSchema)
    .mutation(async ({ input: { meetingId }, ctx: { prisma } }) => {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        select: {
          recordingsGCSBucket: true,
          recordingsFolderPath: true,
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting with that id was not found",
        });
      }

      await deleteRecordingFiles(
        meeting.recordingsGCSBucket,
        meeting.recordingsFolderPath,
      );
    }),
  discardMeeting: auth0Procedure
    .input(discardMeetingInputSchema)
    .mutation(async ({ input: { meetingId }, ctx: { prisma } }) => {
      try {
        await prisma.meeting.delete({
          where: { id: meetingId },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
            cause: e,
          });
        }

        throw e;
      }
    }),
  endMeeting: auth0Procedure
    .input(endMeetingInputSchema)
    .mutation(
      async ({
        input: { meetingId, startTime, endTime, userNotepadNotes },
        ctx: { prisma, stateCode },
      }) => {
        try {
          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              startTime,
              endTime,
              userNotepadNotes,
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Meeting with that id was not found",
              cause: e,
            });
          }

          throw e;
        }

        try {
          await queueStitchingTask(stateCode, meetingId, prisma);
        } catch (e) {
          // Don't throw the error because the meeting should still be ended
          captureException(e);

          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.STITCHING_ERROR,
            },
          });
        }
      },
    ),
  updateNotes: auth0Procedure
    .input(updateNotesInputSchema)
    .mutation(
      async ({
        input: {
          meetingId,
          userNotepadNotes,
          actionItems,
          criticalUpdates,
          caseNote,
        },
        ctx: { prisma },
      }) => {
        try {
          // Stamp *EditedAt only for fields actually included in the request.
          const editedAt = new Date();
          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              userNotepadNotes,
              ...(caseNote !== undefined && {
                caseNote,
                caseNoteEditedAt: editedAt,
              }),
              ...(actionItems !== undefined && {
                actionItems,
                actionItemsEditedAt: editedAt,
              }),
              ...(criticalUpdates !== undefined && {
                criticalUpdates,
              }),
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Meeting with that id was not found",
              cause: e,
            });
          }

          throw e;
        }
      },
    ),
  submitOutputVote: auth0Procedure
    .input(submitOutputVoteInputSchema)
    .mutation(
      async ({
        input: { meetingId, vote, tab },
        ctx: { prisma, stateCode, user, isSkipAuth },
      }) => {
        const staffFeedbackEnabled =
          AGENCY_CONFIGS[stateCode]?.staffFeedbackEnabled ?? false;
        if (tab === OutputVoteTab.STAFF_FEEDBACK && !staffFeedbackEnabled) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Staff feedback is not enabled for this agency",
          });
        }

        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
          select: { outputsPipelineRunId: true, staffEmail: true },
        });

        if (!meeting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
          });
        }

        // Only the staff member who created the meeting can vote on its feedback.
        // Skip-auth (offline/dev) mode uses a mock user, so bypass the ownership
        // check to make feedback testable against any fixture meeting.
        if (!isSkipAuth && meeting.staffEmail !== user.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the meeting creator can vote on staff feedback",
          });
        }

        if (!meeting.outputsPipelineRunId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Cannot vote on output before it has been generated",
          });
        }

        // Append a new row every time. We never update or delete so the full
        // vote history (including thumbs-flips) is preserved for analysis.
        await prisma.outputVote.create({
          data: {
            meetingId,
            voterEmail: user.email,
            vote,
            tab,
            pipelineRunId: meeting.outputsPipelineRunId,
          },
        });
      },
    ),
  submitOutputVoteMessage: auth0Procedure
    .input(submitOutputVoteMessageInputSchema)
    .mutation(
      async ({
        input: { meetingId, tab, message },
        ctx: { prisma, stateCode, user, isSkipAuth },
      }) => {
        const staffFeedbackEnabled =
          AGENCY_CONFIGS[stateCode]?.staffFeedbackEnabled ?? false;
        if (tab === OutputVoteTab.STAFF_FEEDBACK && !staffFeedbackEnabled) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Staff feedback is not enabled for this agency",
          });
        }

        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
          select: { outputsPipelineRunId: true, staffEmail: true },
        });

        if (!meeting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
          });
        }

        // Only the staff member who created the meeting can submit feedback.
        // Skip-auth (offline/dev) mode uses a mock user, so bypass the ownership
        // check to make feedback testable against any fixture meeting.
        if (!isSkipAuth && meeting.staffEmail !== user.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the meeting creator can submit feedback",
          });
        }

        if (!meeting.outputsPipelineRunId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Cannot submit feedback message before outputs have been generated",
          });
        }

        // Update the most recent vote for this user/meeting/tab/pipeline run
        // with the feedback message.
        const latestOutputVote = await prisma.outputVote.findFirst({
          where: {
            meetingId,
            voterEmail: user.email,
            tab,
            pipelineRunId: meeting.outputsPipelineRunId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (!latestOutputVote) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Cannot submit a feedback message without casting a vote first",
          });
        }

        await prisma.outputVote.update({
          where: { id: latestOutputVote.id },
          data: { message },
        });
      },
    ),
  approveSection: auth0Procedure
    .input(approveSectionInputSchema)
    .mutation(
      async ({
        input: { meetingId, section, value },
        ctx: { prisma, user },
      }) => {
        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
          select: { notetakingPipelineRunId: true, staffEmail: true },
        });

        if (!meeting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
          });
        }

        // Only the staff member who created the meeting can approve its notes.
        if (meeting.staffEmail !== user.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the meeting creator can approve notes",
          });
        }

        if (!meeting.notetakingPipelineRunId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Cannot approve notes that have not been generated yet",
          });
        }

        // Append-only: never update/delete, so approve/unapprove history is preserved.
        await prisma.noteApproval.create({
          data: {
            meetingId,
            approverEmail: user.email,
            section,
            value,
            pipelineRunId: meeting.notetakingPipelineRunId,
          },
        });
      },
    ),
});
