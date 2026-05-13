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
import _ from "lodash";
import { z } from "zod";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import { PostMeetingProcessingStatus, Prisma } from "~@meetings/prisma/client";
import {
  deleteRecordingFiles,
  getSignedUrlForNewRecording,
  MinuteSectionSchema,
} from "~@meetings/tasks";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import { deriveValidationErrorType } from "~@meetings/trpc/routes/meeting.helpers";
import {
  createSignedUrlForRecordingInputSchema,
  deleteRecordingsInputSchema,
  discardMeetingInputSchema,
  endMeetingInputSchema,
  getDetailInputSchema,
  getDetailsOutputSchema,
  updateNotesInputSchema,
} from "~@meetings/trpc/routes/meeting/meeting.schema";
import { queueStitchingTask } from "~@meetings/trpc/routes/meeting/utils";

export const meetingRouter = router({
  getDetails: auth0Procedure
    .input(getDetailInputSchema)
    .output(getDetailsOutputSchema)
    .query(async ({ input: { meetingId }, ctx: { prisma, stateCode } }) => {
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
            structuredActionItems: true,
            criticalUpdates: true,
            meetingSummary: true,
            postMeetingProcessingStatus: true,
            durationMs: true,
            transcriptDeletedAt: true,
            staffEmail: true,
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

        const latestPipelineRun = await prisma.notetakingPipelineRun.findFirst({
          where: { meetingId },
          orderBy: { createdAt: "desc" },
          select: { status: true, errorDetails: true },
        });

        const pipelineValidationErrorType = deriveValidationErrorType(
          latestPipelineRun?.errorDetails,
        );

        const stateConfig = AGENCY_CONFIGS[stateCode];

        const includeTranscription = stateConfig?.showTranscriptions ?? true;

        return {
          ..._.omit(meeting, ["transcriptions"]),
          actionItems:
            validateJsonField(meeting.actionItems, z.array(z.string())) || [],
          structuredActionItems:
            validateJsonField(
              meeting.structuredActionItems,
              z.array(
                z.object({
                  task: z.string(),
                  context: z.string().nullable(),
                  evidenceQuotes: z.array(z.string()).nullable().optional(),
                }),
              ),
            ) || [],
          criticalUpdates:
            validateJsonField(meeting.criticalUpdates, z.array(z.string())) ||
            [],
          meetingSummary:
            validateJsonField(
              meeting.meetingSummary,
              MinuteSectionSchema.array(),
            ) || [],
          transcription: includeTranscription
            ? meeting.transcriptions[0] || null
            : undefined,
          validationErrorType: pipelineValidationErrorType,
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
    }),
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
          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              userNotepadNotes,
              actionItems,
              criticalUpdates,
              caseNote,
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
});
