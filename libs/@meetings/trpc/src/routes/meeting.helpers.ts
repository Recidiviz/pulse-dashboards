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
  Prisma,
  PrismaClient,
  StateCode,
} from "~@meetings/prisma/client";
import { ValidationError } from "~@meetings/tasks";
import env from "~@meetings/trpc/env";
import { AuthUser } from "~@meetings/trpc/types";

// Pipeline runs from before PR #12855 don't have validationErrorType in
// errorDetails — for "transcript too short" failures, infer it from the
// message produced by validateWordCount in libs/@meetings/tasks/llm/guards.ts.
const LEGACY_TRANSCRIPT_TOO_SHORT_PREFIX = "Transcript too short";

type PipelineErrorDetails = {
  message?: unknown;
  validationErrorType?: ValidationError | null;
};

export function deriveValidationErrorType(
  errorDetails: PipelineErrorDetails | null | undefined,
): ValidationError | null {
  if (!errorDetails) return null;
  if (errorDetails.validationErrorType) return errorDetails.validationErrorType;
  if (
    typeof errorDetails.message === "string" &&
    errorDetails.message.startsWith(LEGACY_TRANSCRIPT_TOO_SHORT_PREFIX)
  ) {
    return ValidationError.LENGTH;
  }
  return null;
}

export async function createMeetingForPerson({
  prisma,
  user,
  personId,
  startTime,
  personType,
  meetingId,
  meetingType,
  stateCode,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  personId: bigint;
  startTime: Date;
  personType: "client" | "resident";
  meetingId: string;
  meetingType: string;
  stateCode: StateCode;
}) {
  if (
    env.DEPLOY_ENV === "production" &&
    (user.isRecidivizUser || user.impersonatedBy) &&
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
      meetingType,
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
      endTime: { not: null },
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
      meetingType: true,
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
    validationErrorType: deriveValidationErrorType(
      latestRunByMeetingId[meeting.id]?.errorDetails,
    ),
  }));
}

type PersonMeeting = {
  id: string;
  endTime: Date | null;
  startTime: Date;
  staffEmail: string;
  caseNote: string | null;
};

function extractActiveMeetingId({
  user,
  meetingsOrderedByDateDesc,
}: {
  user: AuthUser;
  meetingsOrderedByDateDesc: PersonMeeting[];
}) {
  const activeMeeting = meetingsOrderedByDateDesc.find(
    (meeting) => meeting.endTime == null && meeting.staffEmail == user.email,
  );
  return activeMeeting?.id ?? null;
}

async function extractLastCompletedMeetingInfo({
  prisma,
  meetingsOrderedByDateDesc,
}: {
  prisma: PrismaClient;
  meetingsOrderedByDateDesc: PersonMeeting[];
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

  return {
    id: latestMeeting.id,
    lastCompletedMeetingTime: latestMeeting.startTime,
    caseNote: latestMeeting?.caseNote ?? null,
    validationErrorType: deriveValidationErrorType(
      latestPipelineRun?.errorDetails,
    ),
    staffEmail: latestMeeting.staffEmail,
  };
}

export async function enrichPersonWithMeetingInfo<
  T extends { meetings: PersonMeeting[] },
>({
  prisma,
  user,
  person,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  person: T;
}) {
  const { meetings, ...rest } = person;
  return {
    ...rest,
    activeMeetingId: extractActiveMeetingId({
      user,
      meetingsOrderedByDateDesc: meetings,
    }),
    meetingDetails: await extractLastCompletedMeetingInfo({
      prisma,
      meetingsOrderedByDateDesc: meetings,
    }),
  };
}

export async function listPersonsWithMeetingInfo<
  T extends { personId: bigint; meetings: PersonMeeting[] },
  F extends { search?: string } = { search?: string },
  S extends { sortBy?: string; sortDirection?: string } = {
    sortBy?: string;
    sortDirection?: string;
  },
>({
  prisma,
  user,
  personType,
  input,
  getSecondaryOrderBy,
  findManyByIds,
  additionalWhere,
}: {
  prisma: PrismaClient;
  user: AuthUser;
  personType: "client" | "resident";
  input:
    | {
        page?: number;
        size?: number;
        filters?: F;
        sort?: S;
      }
    | undefined;
  getSecondaryOrderBy: (
    sortBy: S["sortBy"] | undefined,
    sortDirection: S["sortDirection"] | undefined,
  ) => Prisma.Sql;
  findManyByIds: (personIds: bigint[]) => Promise<T[]>;
  additionalWhere?: Prisma.Sql;
}) {
  const { page = 1, size = 20, filters, sort } = input ?? {};
  const { search } = filters ?? {};
  const { sortBy, sortDirection } = sort ?? {};

  const tableSql = Prisma.raw(
    personType === "client" ? `"Client"` : `"Resident"`,
  );
  const fkSql = Prisma.raw(
    personType === "client" ? `"clientId"` : `"residentId"`,
  );

  const lastMeetingJoin =
    sortBy === "lastMeeting"
      ? Prisma.sql`LEFT JOIN "Meeting" m ON m.${fkSql} = p."personId" AND m."endTime" IS NOT NULL`
      : Prisma.empty;

  const searchFilter = search
    ? Prisma.sql`AND (
        (p."givenNames" || ' ' || p."surname") ILIKE ${`%${search}%`}
        OR p."displayPersonExternalId" ILIKE ${`%${search}%`}
      )`
    : Prisma.empty;

  const extraWhere = additionalWhere ?? Prisma.empty;

  // We use raw SQL to compute the page of person IDs (paginated, sorted, and
  // filtered) plus a windowed total in a single round-trip, then hydrate those
  // IDs through Prisma to keep the rest of the result type-safe. Doing the
  // full query through Prisma would require expressing things like
  // `BOOL_OR(activeMeeting IS NOT NULL) DESC` and a windowed COUNT, which
  // Prisma doesn't support cleanly; doing the full query through raw SQL
  // would lose type safety on every selected field. This split keeps each
  // half doing what it's good at.
  const orderedIds = await prisma.$queryRaw<
    { personId: bigint; total: bigint }[]
  >`
    SELECT p."personId", COUNT(*) OVER() AS total
    FROM ${tableSql} p
    LEFT JOIN "Meeting" am
      ON am.${fkSql} = p."personId"
      AND am."endTime" IS NULL
      AND am."staffEmail" = ${user.email}
    ${lastMeetingJoin}
    WHERE p."isActive" = true
    ${searchFilter}
    ${extraWhere}
    GROUP BY p."personId"
    ORDER BY
      BOOL_OR(am."id" IS NOT NULL) DESC,
      ${getSecondaryOrderBy(sortBy, sortDirection)}
    LIMIT ${size}
    OFFSET ${(page - 1) * size}
  `;

  const total = orderedIds.length > 0 ? Number(orderedIds[0].total) : 0;
  const personIds = orderedIds.map((r) => r.personId);

  // Raw SQL handles the complex sorting and filtering logic (e.g. "has active meeting"
  // priority, search, secondary sort), but we use Prisma for the full person fetch to
  // keep type safety. We then re-order by the SQL-returned IDs to restore the sort.
  const unordered = await findManyByIds(personIds);

  const byId = new Map(unordered.map((p) => [p.personId, p]));
  const persons = personIds.map((id) => {
    const person = byId.get(id);
    if (!person) {
      throw new Error(`${personType} ${id} not found during sort`);
    }
    return person;
  });

  const data = await Promise.all(
    persons.map((person) =>
      enrichPersonWithMeetingInfo({ prisma, user, person }),
    ),
  );

  return {
    data,
    page,
    total,
    totalPages: Math.ceil(total / size),
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
