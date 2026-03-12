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

import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";

import {
  PostMeetingProcessingStatus,
  PrismaClient,
} from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import { AuthUser } from "~@meetings/trpc/types";

export async function createMeetingForPerson({
  prisma,
  user,
  personId,
  startTime,
  personType,
  meetingId,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  personId: bigint;
  startTime: Date;
  personType: "client" | "resident";
  meetingId?: string;
}) {
  if (env.DEPLOY_ENV === "production" && user.isRecidivizUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Recidiviz users may not create meetings in production",
    });
  }

  // TODO - AVild: Remove this logic once we remove meeting ID as
  // optional
  meetingId = meetingId ?? createId();

  return await prisma.meeting.create({
    data: {
      id: meetingId,
      [personType]: {
        connect: {
          personId,
        },
      },
      staffEmail: user.email,
      startTime,
      recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
      recordingsFolderPath: meetingId,
    },
    select: {
      id: true,
      startTime: true,
    },
  });
}

export async function getMeetingsForPerson({
  prisma,
  user,
  personId,
  personType,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  personId: bigint;
  personType: "client" | "resident";
}) {
  return await prisma.meeting.findMany({
    where: {
      [`${personType}Id`]: personId,
      OR: [
        {
          staffEmail: user.email,
        },
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
      caseNote: true,
    },
  });
}

export function extractActiveMeetingId({
  user,
  meetingsOrderedByDateDesc,
}: {
  user: AuthUser;
  meetingsOrderedByDateDesc: {
    endTime: Date | null;
    startTime: Date;
    staffEmail: string;
    id: string;
  }[];
}) {
  const activeMeeting = meetingsOrderedByDateDesc.find(
    (meeting) => meeting.endTime == null && meeting.staffEmail == user.email,
  );
  return activeMeeting?.id ?? null;
}

export function extractLastCompletedMeetingTime({
  meetingsOrderedByDateDesc,
}: {
  meetingsOrderedByDateDesc: { endTime: Date | null; startTime: Date }[];
}) {
  const latestMeeting = meetingsOrderedByDateDesc.find(
    (meeting) => meeting.endTime != null,
  );
  return latestMeeting?.startTime ?? null;
}
