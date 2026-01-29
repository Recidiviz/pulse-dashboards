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

import _ from "lodash";
import { z } from "zod";

import { Prisma } from "~@meetings/prisma/client/client";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  createMeetingInputSchema,
  getMeetingsInputSchema,
} from "~@meetings/trpc/routes/client/client.schema";
import {
  createMeetingForPerson,
  extractActiveMeetingId,
  extractLastCompletedMeetingTime,
  getMeetingsForPerson,
} from "~@meetings/trpc/routes/meeting.helpers";

const querySelect = {
  givenNames: true,
  surname: true,
  displayPersonExternalId: true,
  personId: true,
  supervisionType: true,
  meetings: {
    orderBy: {
      startTime: "desc",
    },
    select: {
      id: true,
      staff: true,
      endTime: true,
      startTime: true,
    },
  },
  staff: {
    select: {
      staff: {
        select: {
          pseudonymizedId: true,
        },
      },
    },
  },
} satisfies Prisma.ClientSelect;

export const clientRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({ input: { clientId, startTime }, ctx: { prisma, user } }) => {
        return createMeetingForPerson({
          prisma,
          user,
          personId: clientId,
          startTime,
          personType: "client",
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

  list: auth0Procedure.query(async ({ ctx: { prisma, user } }) => {
    const clients = await prisma.client.findMany({
      select: querySelect,
      where: {
        isActive: true,
      },
    });

    return clients.map((client) => ({
      ..._.omit(client, ["meetings", "staff"]),
      activeMeetingId: extractActiveMeetingId({
        user: user,
        meetingsOrderedByDateDesc: client.meetings,
      }),
      meetingDetails: {
        lastCompletedMeetingTime: extractLastCompletedMeetingTime({
          meetingsOrderedByDateDesc: client.meetings,
        }),
      },
      assignedStaffPseudoIds: client.staff.map((s) => s.staff.pseudonymizedId),
    }));
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
      return {
        ..._.omit(client, ["meetings", "staff"]),
        activeMeetingId: extractActiveMeetingId({
          user: user,
          meetingsOrderedByDateDesc: client.meetings,
        }),
        meetingDetails: {
          lastCompletedMeetingTime: extractLastCompletedMeetingTime({
            meetingsOrderedByDateDesc: client.meetings,
          }),
        },
        assignedStaffPseudoIds: client.staff.map(
          (s) => s.staff.pseudonymizedId,
        ),
      };
    }),
});
