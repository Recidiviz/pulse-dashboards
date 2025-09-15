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
import { createMeetingInputSchema } from "~@meetings/trpc/routes/client/client.schema";

export const clientRouter = router({
  createMeeting: auth0Procedure
    .input(createMeetingInputSchema)
    .mutation(
      async ({
        input: { clientId, startTime, endTime, address },
        ctx: { prisma, user },
      }) => {
        return await prisma.meeting.create({
          data: {
            staff: {
              connect: {
                pseudonymizedId: user.pseudonymizedId,
              },
            },
            client: {
              connect: {
                personId: clientId,
              },
            },
            startTime,
            endTime,
            address,
          },
          select: {
            startTime: true,
            endTime: true,
            address: true,
          },
        });
      },
    ),
});
