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

import {
  PostMeetingProcessingStatus,
  Prisma,
  PrismaClient,
  Staff,
} from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import { AuthUser } from "~@meetings/trpc/types";

export async function createMeetingForPerson({
  prisma,
  user,
  personId,
  startTime,
  personType,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  personId: bigint;
  startTime: Date;
  personType: "client" | "resident";
}) {
  if (env.DEPLOY_ENV === "production" && user.pseudonymizedId === "RECIDIVIZ") {
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
      [personType]: {
        connect: {
          personId,
        },
      },
      startTime,
      recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
      recordingsFolderPath: "placeholder",
    },
  });

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
      [`${personType}Id`]: personId,
      OR: [
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
}

export function extractActiveMeetingId({
  user,
  meetingsOrderedByDateDesc,
}: {
  user: AuthUser;
  meetingsOrderedByDateDesc: {
    endTime: Date | null;
    startTime: Date;
    staff: Staff | null;
    id: string;
  }[];
}) {
  const activeMeeting = meetingsOrderedByDateDesc.find(
    (meeting) =>
      meeting.endTime == null &&
      (meeting.staff?.pseudonymizedId == user.pseudonymizedId ||
        user.pseudonymizedId === "RECIDIVIZ"), //TODO(#11367)
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
