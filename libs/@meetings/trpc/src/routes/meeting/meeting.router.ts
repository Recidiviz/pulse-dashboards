// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { PostMeetingProcessingStatus, Prisma } from "~@meetings/prisma/client";
import {
  getSignedUrlForNewRecording,
  MOBILE_AUDIO_FILE_EXTENSION,
  MOBILE_GCS_CONTENT_TYPE,
  WEB_AUDIO_FILE_EXTENSION,
  WEB_GCS_CONTENT_TYPE,
} from "~@meetings/tasks";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  discardMeetingInputSchema,
  endMeetingInputSchema,
  getDetailInputSchema,
  getSignedUrlForRecordingInputSchema,
  updateNotesInputSchema,
} from "~@meetings/trpc/routes/meeting/meeting.schema";
import { queueStitchingTask } from "~@meetings/trpc/routes/meeting/utils";

export const meetingRouter = router({
  getDetails: auth0Procedure
    .input(getDetailInputSchema)
    .query(async ({ input: { clientId, meetingId }, ctx: { prisma } }) => {
      try {
        const meeting = await prisma.meeting.findUniqueOrThrow({
          where: {
            id: meetingId,
            clientId: clientId,
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            notes: true,
            postMeetingProcessingStatus: true,
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

        return {
          ..._.omit(meeting, ["transcriptions"]),
          transcription: meeting.transcriptions[0],
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
  getSignedUrlForRecording: auth0Procedure
    .input(getSignedUrlForRecordingInputSchema)
    .query(
      async ({ input: { clientId, meetingId, platform }, ctx: { prisma } }) => {
        const meeting = await prisma.meeting.findUnique({
          where: {
            id: meetingId,
            clientId: clientId,
          },
        });

        if (!meeting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
          });
        }

        // Determine file extension and content type based on platform
        let fileExtension: string;
        let contentType: string;

        if (platform === "web") {
          fileExtension = WEB_AUDIO_FILE_EXTENSION;
          contentType = WEB_GCS_CONTENT_TYPE;
        } else {
          // Default to mobile format for iOS, Android, or if platform not specified
          fileExtension = MOBILE_AUDIO_FILE_EXTENSION;
          contentType = MOBILE_GCS_CONTENT_TYPE;
        }

        return await getSignedUrlForNewRecording(
          meeting.recordingsGCSBucket,
          meeting.recordingsFolderPath,
          fileExtension,
          contentType,
        );
      },
    ),
  discardMeeting: auth0Procedure
    .input(discardMeetingInputSchema)
    .mutation(async ({ input: { clientId, meetingId }, ctx: { prisma } }) => {
      try {
        await prisma.meeting.delete({
          where: {
            id: meetingId,
            clientId: clientId,
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
    }),
  endMeeting: auth0Procedure
    .input(endMeetingInputSchema)
    .mutation(
      async ({
        input: { clientId, meetingId, notes },
        ctx: { prisma, stateCode },
      }) => {
        try {
          await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
            },
            data: {
              endTime: new Date(),
              notes,
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
            where: {
              id: meetingId,
              clientId: clientId,
            },
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
      async ({ input: { clientId, meetingId, notes }, ctx: { prisma } }) => {
        try {
          await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
            },
            data: {
              notes: notes,
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
