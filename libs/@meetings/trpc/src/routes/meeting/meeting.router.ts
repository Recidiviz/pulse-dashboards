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

import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/node";
import { TRPCError } from "@trpc/server";

import { PostMeetingProcessingStatus, Prisma } from "~@meetings/prisma/client";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  endMeetingInputSchema,
  getSignedUrlForRecordingInputSchema,
} from "~@meetings/trpc/routes/meeting/meeting.schema";
import { stitchAudioForMeeting } from "~@meetings/trpc/routes/meeting/utils";

const CONTENT_TYPE = "audio/webm";

export const meetingRouter = router({
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

        // Creates a client
        const storage = new Storage();
        const bucket = storage.bucket(meeting.recordingsGCSBucket);

        // Make the file name the time since epoch so that we know the order of the recordings for a meeting
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        const fileName = `${meeting.recordingsFolderPath}/${secondsSinceEpoch}.webm`;
        const file = bucket.file(fileName);

        const [url] = await file.getSignedUrl({
          version: "v4",
          action: "write",
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          contentType: CONTENT_TYPE,
        });

        return url;
      },
    ),
  endMeeting: auth0Procedure
    .input(endMeetingInputSchema)
    .mutation(
      async ({ input: { clientId, meetingId }, ctx: { prisma, user } }) => {
        let meeting;
        try {
          meeting = await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
            },
            data: {
              endTime: new Date(),
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.STITCHING,
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
          await stitchAudioForMeeting(
            meeting.recordingsGCSBucket,
            meeting.recordingsFolderPath,
          );
        } catch (e) {
          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.STITCHING_ERROR,
            },
          });

          captureException(e);

          // Don't throw an error because the meeting was ended successfully.
          // TODO: implement a way to retry the stitching step via a job
          return;
        }

        await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.TRANSCRIBING,
          },
        });

        // TODO: implement transcription step
      },
    ),
});
