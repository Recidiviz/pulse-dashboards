// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { z } from "zod";

import { Prisma } from "~@meetings/prisma/client";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  createMeetingForPerson,
  enrichPersonWithMeetingInfo,
  getMeetingsForPerson,
  listPersonsWithMeetingInfo,
} from "~@meetings/trpc/routes/meeting.helpers";
import {
  createMeetingInputSchema,
  getMeetingsInputSchema,
  listInputSchema,
  listSortSchema,
} from "~@meetings/trpc/routes/resident/resident.schema";

const querySelect = {
  givenNames: true,
  surname: true,
  displayPersonExternalId: true,
  personId: true,
  facilityId: true,
  meetings: {
    orderBy: {
      startTime: "desc",
    },
    select: {
      id: true,
      staffEmail: true,
      endTime: true,
      startTime: true,
      caseNote: true,
    },
  },
} satisfies Prisma.ResidentSelect;

type ListSort = z.infer<typeof listSortSchema> | undefined;
function getSecondaryOrderBy(
  sortBy: NonNullable<ListSort>["sortBy"],
  sortDirection: NonNullable<ListSort>["sortDirection"],
): Prisma.Sql {
  const dirSql = sortDirection === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  switch (sortBy) {
    case "lastMeeting":
      return Prisma.sql`MAX(m."startTime") ${dirSql} NULLS LAST, p."personId" ASC`;
    case "id":
      return Prisma.sql`p."displayPersonExternalId" ${dirSql}`;
    case "facility":
      return Prisma.sql`p."facilityId" ${dirSql}`;
    case "name":
      return Prisma.sql`p."givenNames" ${dirSql}, p."surname" ${dirSql}`;
    default:
      return Prisma.sql`p."givenNames" ${dirSql}, p."surname" ${dirSql}`;
  }
}

export const residentRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({
        input: {
          residentId,
          startTime,
          meetingId,
          meetingType,
          meetingTypeCategory,
        },
        ctx: { prisma, user, stateCode },
      }) => {
        return createMeetingForPerson({
          prisma,
          user,
          personId: residentId,
          startTime,
          meetingId,
          meetingType,
          meetingTypeCategory,
          personType: "resident",
          stateCode,
        });
      },
    ),
  getMeetings: auth0Procedure
    .input(getMeetingsInputSchema)
    .query(async ({ input: { residentId }, ctx: { prisma, user } }) => {
      return getMeetingsForPerson({
        prisma,
        user,
        personId: residentId,
        personType: "resident",
      });
    }),
  get: auth0Procedure
    .input(z.object({ personId: z.bigint() }))
    .query(async ({ input: { personId }, ctx: { prisma, user } }) => {
      const resident = await prisma.resident.findUnique({
        where: { personId },
        select: querySelect,
      });

      if (!resident) {
        throw new Error("Resident not found");
      }

      return enrichPersonWithMeetingInfo({ prisma, user, person: resident });
    }),
  list: auth0Procedure
    .input(listInputSchema)
    .query(async ({ input, ctx: { prisma, user } }) => {
      const { cursor, filters, sort, ...rest } = input ?? {};
      // `cursor` from the client is actually a page number (see schema). Map
      // it onto `page` so downstream code uses the accurate name.
      const effectiveInput = {
        ...rest,
        filters,
        sort,
        ...(cursor !== undefined ? { page: cursor } : {}),
      };

      const result = await listPersonsWithMeetingInfo({
        prisma,
        user,
        personType: "resident",
        input: effectiveInput,
        getSecondaryOrderBy,
        findManyByIds: (personIds) =>
          prisma.resident.findMany({
            select: querySelect,
            where: { personId: { in: personIds } },
          }),
      });

      // Returned as `nextCursor` to match the convention `useInfiniteQuery`
      // expects, but it's just the next page number.
      const nextCursor =
        result.page < result.totalPages ? result.page + 1 : undefined;

      return { ...result, nextCursor };
    }),
});
