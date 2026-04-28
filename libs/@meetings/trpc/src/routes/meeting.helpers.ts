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
import keyBy from "lodash/keyBy";
import uniqBy from "lodash/uniqBy";

import {
  PostMeetingProcessingStatus,
  PrismaClient,
  StateCode,
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
  stateCode,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  personId: bigint;
  startTime: Date;
  personType: "client" | "resident";
  meetingId: string;
  stateCode: StateCode;
}) {
  if (
    env.DEPLOY_ENV === "production" &&
    user.isRecidivizUser &&
    stateCode !== "US_DEMO"
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Recidiviz users may not create non-demo meetings in production",
    });
  }

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
  const meetings = await prisma.meeting.findMany({
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
      durationMs: true,
    },
  });

  const pipelineRuns = await prisma.notetakingPipelineRun.findMany({
    where: { meetingId: { in: meetings.map((m) => m.id) } },
    orderBy: { createdAt: "desc" },
    select: { meetingId: true, errorDetails: true },
  });

  const latestRunByMeetingId = keyBy(
    uniqBy(pipelineRuns, "meetingId"),
    "meetingId",
  );

  return meetings.map((meeting) => ({
    ...meeting,
    validationErrorType:
      latestRunByMeetingId[meeting.id]?.errorDetails?.validationErrorType ??
      null,
  }));
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

export async function extractLastCompletedMeetingInfo({
  prisma,
  meetingsOrderedByDateDesc,
}: {
  prisma: PrismaClient;
  meetingsOrderedByDateDesc: {
    id: string;
    endTime: Date | null;
    startTime: Date;
    caseNote: string | null;
    staffEmail: string;
  }[];
}) {
  const latestMeeting = meetingsOrderedByDateDesc.find(
    (meeting) => meeting.endTime != null,
  );

  if (!latestMeeting) {
    return {
      id: null,
      lastCompletedMeetingTime: null,
      caseNote: null,
      validationErrorType: null,
      staffEmail: null,
    };
  }

  const latestPipelineRun = await prisma.notetakingPipelineRun.findFirst({
    where: { meetingId: latestMeeting.id },
    orderBy: { createdAt: "desc" },
    select: { meetingId: true, errorDetails: true },
  });

  const pipelineValidationErrorType =
    latestPipelineRun?.errorDetails?.validationErrorType;

  return {
    id: latestMeeting.id,
    lastCompletedMeetingTime: latestMeeting.startTime,
    caseNote: latestMeeting?.caseNote ?? null,
    validationErrorType: pipelineValidationErrorType ?? null,
    staffEmail: latestMeeting.staffEmail,
  };
}

type PersonWithNames = {
  givenNames: string;
  middleNames?: string | null;
  surname: string;
};

export function getPersonNameTokens(person: PersonWithNames): string[] {
  return [
    ...person.givenNames.split(" "),
    ...(person.middleNames?.split(" ") ?? []),
    person.surname,
  ].filter(Boolean);
}
