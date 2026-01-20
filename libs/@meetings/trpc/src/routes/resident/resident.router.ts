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

import _ from "lodash";
import { z } from "zod";

import { Prisma } from "~@meetings/prisma/client/client";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  createMeetingForPerson,
  getMeetingsForPerson,
} from "~@meetings/trpc/routes/meeting.helpers";
import {
  extractActiveMeetingId,
  extractLastCompletedMeetingTime,
} from "~@meetings/trpc/routes/meeting.helpers";
import {
  createMeetingInputSchema,
  getMeetingsInputSchema,
} from "~@meetings/trpc/routes/resident/resident.schema";

export const residentRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({ input: { residentId, startTime }, ctx: { prisma, user } }) => {
        return createMeetingForPerson({
          prisma,
          user,
          personId: residentId,
          startTime,
          personType: "resident",
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
    .query(async ({ input: { personId }, ctx: { prisma } }) => {
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
            staff: true,
            endTime: true,
            startTime: true,
          },
        },
      } satisfies Prisma.ResidentSelect;

      const resident = await prisma.resident.findUnique({
        where: { personId },
        select: querySelect,
      });

      if (!resident) {
        throw new Error("Resident not found");
      }

      return {
        ..._.omit(resident, ["meetings"]),
        activeMeetingId: extractActiveMeetingId({
          user: null,
          meetingsOrderedByDateDesc: resident.meetings,
        }),
        meetingDetails: {
          lastCompletedMeetingTime: extractLastCompletedMeetingTime({
            meetingsOrderedByDateDesc: resident.meetings,
          }),
        },
      };
    }),
  list: auth0Procedure.query(async ({ ctx: { prisma } }) => {
    const residents = await prisma.resident.findMany({
      select: {
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
            staff: true,
            endTime: true,
            startTime: true,
          },
        },
      },
      where: {
        isActive: true,
      },
    });

    return residents.map((resident) => ({
      ..._.omit(resident, ["meetings"]),
      activeMeetingId: extractActiveMeetingId({
        user: null,
        meetingsOrderedByDateDesc: resident.meetings,
      }),
      meetingDetails: {
        lastCompletedMeetingTime: extractLastCompletedMeetingTime({
          meetingsOrderedByDateDesc: resident.meetings,
        }),
      },
    }));
  }),
});
