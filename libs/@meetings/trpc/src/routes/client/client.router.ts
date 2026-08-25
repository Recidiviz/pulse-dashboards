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
import { z } from "zod";

import { Prisma } from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  createMeetingInputSchema,
  getMeetingsInputSchema,
  listInputSchema,
  listSortSchema,
  submitCNIVoteInputSchema,
  submitCNIVoteMessageInputSchema,
} from "~@meetings/trpc/routes/client/client.schema";
import {
  createMeetingForPerson,
  enrichPersonWithMeetingInfo,
  getMeetingsForPerson,
  listPersonsWithMeetingInfo,
} from "~@meetings/trpc/routes/meeting.helpers";
import { AuthUser } from "~@meetings/trpc/types";

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
  caseNoteInsightsSummaries: true,
} satisfies Prisma.ClientSelect;

function assertCanSubmitCNIFeedback(user: AuthUser) {
  if (
    env.DEPLOY_ENV === "production" &&
    (user.isRecidivizUser || user.impersonatedBy)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Recidiviz users may not give CNI feedback in production",
    });
  }
}

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
    case "supervisionType":
      return Prisma.sql`p."supervisionType" ${dirSql}`;
    case "name":
      return Prisma.sql`p."surname" ${dirSql}, p."givenNames" ${dirSql}`;
    default:
      return Prisma.sql`p."givenNames" ${dirSql}, p."surname" ${dirSql}`;
  }
}

export const clientRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({
        input: {
          clientId,
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
          personId: clientId,
          meetingId,
          meetingType,
          meetingTypeCategory,
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
      const { cursor, filters, sort, ...rest } = input ?? {};
      // `cursor` from the client is actually a page number (see schema). Map
      // it onto `page` so downstream code uses the accurate name.
      const effectiveInput = {
        ...rest,
        filters,
        sort,
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

  submitCNIVote: auth0Procedure
    .input(submitCNIVoteInputSchema)
    .mutation(
      async ({
        input: { clientId, vote, snapshot },
        ctx: { prisma, user },
      }) => {
        assertCanSubmitCNIFeedback(user);

        // Append a new row every time. We never update or delete so the full
        // vote history (including thumbs-flips) is preserved for analysis.
        const { id } = await prisma.caseNoteInsightsFeedback.create({
          select: { id: true },
          data: {
            authorEmail: user.email,
            vote,
            summariesSnapshot: snapshot,
            clientId,
          },
        });

        return { id };
      },
    ),

  submitCNIVoteMessage: auth0Procedure
    .input(submitCNIVoteMessageInputSchema)
    .mutation(
      async ({ input: { feedbackId, message }, ctx: { prisma, user } }) => {
        assertCanSubmitCNIFeedback(user);

        try {
          await prisma.caseNoteInsightsFeedback.update({
            where: { id: feedbackId, authorEmail: user.email },
            data: { message },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "No CNI feedback found for this id",
              cause: e,
            });
          }
          throw e;
        }
      },
    ),
});
