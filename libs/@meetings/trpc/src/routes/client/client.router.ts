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

import { z } from "zod";

import { Prisma } from "~@meetings/prisma/client";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  clientSortBySchema,
  createMeetingInputSchema,
  getMeetingsInputSchema,
  listInputSchema,
} from "~@meetings/trpc/routes/client/client.schema";
import {
  createMeetingForPerson,
  enrichPersonWithMeetingInfo,
  getMeetingsForPerson,
  listPersonsWithMeetingInfo,
} from "~@meetings/trpc/routes/meeting.helpers";

const querySelect = {
  givenNames: true,
  surname: true,
  displayPersonExternalId: true,
  personId: true,
  supervisionType: true,
  staffEmails: true,
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
} satisfies Prisma.ClientSelect;

function getSecondaryOrderBy(
  sortBy: z.infer<typeof clientSortBySchema> | undefined,
): Prisma.Sql {
  switch (sortBy) {
    case "lastMeeting":
      return Prisma.sql`MAX(m."startTime") DESC NULLS LAST, p."personId" ASC`;
    case "id":
      return Prisma.sql`p."displayPersonExternalId" ASC`;
    case "supervisionType":
      return Prisma.sql`p."supervisionType" ASC`;
    case "name":
    default:
      return Prisma.sql`p."givenNames" ASC, p."surname" ASC`;
  }
}

export const clientRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({
        input: { clientId, startTime, meetingId },
        ctx: { prisma, user, stateCode },
      }) => {
        return createMeetingForPerson({
          prisma,
          user,
          personId: clientId,
          meetingId,
          startTime,
          personType: "client",
          stateCode,
        });
      },
    ),
  getMeetings: auth0Procedure
    .input(getMeetingsInputSchema)
    .query(async ({ input: { clientId }, ctx: { prisma, user } }) => {
      return getMeetingsForPerson({
        prisma,
        user,
        personId: clientId,
        personType: "client",
      });
    }),

  list: auth0Procedure
    .input(listInputSchema)
    .query(async ({ input, ctx: { prisma, user } }) => {
      const { cursor, filters, ...rest } = input ?? {};
      // `cursor` from the client is actually a page number (see schema). Map
      // it onto `page` so downstream code uses the accurate name.
      const effectiveInput = {
        ...rest,
        filters,
        ...(cursor !== undefined ? { page: cursor } : {}),
      };

      const caseload = filters?.caseload ?? "all";
      const email = user.email.toLowerCase();
      let additionalWhere: Prisma.Sql | undefined;
      if (caseload === "mine") {
        additionalWhere = Prisma.sql`AND ${email} = ANY(p."staffEmails")`;
      } else if (caseload === "others") {
        additionalWhere = Prisma.sql`AND NOT (${email} = ANY(p."staffEmails"))`;
      }

      const result = await listPersonsWithMeetingInfo({
        prisma,
        user,
        personType: "client",
        input: effectiveInput,
        getSecondaryOrderBy,
        additionalWhere,
        findManyByIds: (personIds) =>
          prisma.client.findMany({
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

  get: auth0Procedure
    .input(z.object({ personId: z.bigint() }))
    .query(async ({ input: { personId }, ctx: { prisma, user } }) => {
      const client = await prisma.client.findUnique({
        select: querySelect,
        where: { personId },
      });

      if (!client) {
        throw new Error("Client not found or access denied");
      }

      return enrichPersonWithMeetingInfo({ prisma, user, person: client });
    }),
});
