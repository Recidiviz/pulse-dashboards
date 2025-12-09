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

import { TRPCError } from "@trpc/server";

import { PostMeetingProcessingStatus, Prisma } from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  createMeetingInputSchema,
  getMeetingsInputSchema,
} from "~@meetings/trpc/routes/client/client.schema";

export const clientRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({ input: { clientId, startTime }, ctx: { prisma, user } }) => {
        if (
          env.NODE_ENV === "production" &&
          user.pseudonymizedId === "RECIDIVIZ"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Recidiviz users may not create meetings in production",
          });
        }
        const staffPseudoId =
          user.pseudonymizedId === "RECIDIVIZ" ? null : user.pseudonymizedId;
        const meeting = await prisma.meeting.create({
          data: {
            ...(staffPseudoId && {
              staff: {
                connect: {
                  pseudonymizedId: staffPseudoId,
                },
              },
            }),
            client: {
              connect: {
                personId: clientId,
              },
            },
            startTime,
            recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
            recordingsFolderPath: "placeholder",
          },
        });

        // Use the meeting ID as the recordings folder path since we don't know it during creation
        return await prisma.meeting.update({
          where: {
            id: meeting.id,
          },
          data: {
            recordingsFolderPath: meeting.id,
          },
          select: {
            id: true,
            startTime: true,
          },
        });
      },
    ),
  getMeetings: auth0Procedure
    .input(getMeetingsInputSchema)
    .query(async ({ input: { clientId }, ctx: { prisma, user } }) => {
      const staffWhereClause = (
        user.pseudonymizedId === "RECIDIVIZ"
          ? {
              staffId: null,
            }
          : {
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
            }
      ) satisfies Prisma.MeetingWhereInput;

      return await prisma.meeting.findMany({
        where: {
          clientId,
          OR: [
            // Users should only be able to see in-progress meetings if they were with that user,
            // but all staff can see completed/processing meetings.
            staffWhereClause,
            {
              postMeetingProcessingStatus: {
                not: PostMeetingProcessingStatus.NOT_STARTED,
              },
            },
          ],
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          postMeetingProcessingStatus: true,
        },
      });
    }),
});
