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

import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  createMeetingInputSchema,
  getMeetingsInputSchema,
} from "~@meetings/trpc/routes/client/client.schema";
import {
  createMeetingForPerson,
  getMeetingsForPerson,
} from "~@meetings/trpc/routes/meeting.helpers";

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
});
