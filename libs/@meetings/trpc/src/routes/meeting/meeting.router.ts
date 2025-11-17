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
import { getSignedUrlForNewRecording } from "~@meetings/tasks";
import env from "~@meetings/trpc/env";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  discardMeetingInputSchema,
  endMeetingInputSchema,
  getDetailInputSchema,
  getSignedUrlForRecordingInputSchema,
  updateNotesInputSchema,
} from "~@meetings/trpc/routes/meeting/meeting.schema";
import {
  queueStitchingTaskCloud,
  queueStitchingTaskLocal,
} from "~@meetings/trpc/routes/meeting/utils";

export const meetingRouter = router({
  getDetails: auth0Procedure
    .input(getDetailInputSchema)
    .query(
      async ({ input: { clientId, meetingId }, ctx: { prisma, user } }) => {
        try {
          const meeting = await prisma.meeting.findUniqueOrThrow({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
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
      },
    ),
  getSignedUrlForRecording: auth0Procedure
    .input(getSignedUrlForRecordingInputSchema)
    .query(
      async ({ input: { clientId, meetingId }, ctx: { prisma, user } }) => {
        const meeting = await prisma.meeting.findUnique({
          where: {
            id: meetingId,
            clientId: clientId,
            staff: {
              pseudonymizedId: user.pseudonymizedId,
            },
          },
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
        );
      },
    ),
  discardMeeting: auth0Procedure
    .input(discardMeetingInputSchema)
    .mutation(
      async ({ input: { clientId, meetingId }, ctx: { prisma, user } }) => {
        try {
          await prisma.meeting.delete({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
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
  endMeeting: auth0Procedure
    .input(endMeetingInputSchema)
    .mutation(
      async ({
        input: { clientId, meetingId, notes },
        ctx: { prisma, user, stateCode },
      }) => {
        try {
          await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
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

        // Go ahead and set the status to stitching queued so we don't accidentally overwrite it from the other process
        await prisma.meeting.update({
          where: {
            id: meetingId,
            clientId: clientId,
            staff: {
              pseudonymizedId: user.pseudonymizedId,
            },
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.STITCHING_QUEUED,
          },
        });

        try {
          // If we're on a local environment, there is no way to emulate Cloud Tasks, so we just call endpoint directly
          if (env.NODE_ENV === "development") {
            await queueStitchingTaskLocal(stateCode, meetingId);
          } else {
            await queueStitchingTaskCloud(stateCode, meetingId);
          }
        } catch (e) {
          // Don't throw the error because the meeting should still be ended
          captureException(e);

          await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
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
      async ({
        input: { clientId, meetingId, notes },
        ctx: { prisma, user },
      }) => {
        try {
          await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
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
