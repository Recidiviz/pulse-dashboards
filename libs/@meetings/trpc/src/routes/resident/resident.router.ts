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

import { auth0Procedure, router } from "~@meetings/trpc/init";

export const residentRouter = router({
  list: auth0Procedure.query(async ({ ctx: { prisma } }) => {
    const residents = await prisma.resident.findMany({
      select: {
        givenNames: true,
        surname: true,
        displayPersonExternalId: true,
        personId: true,
        facilityId: true,
        // Only get the latest active meeting, if it exists
        meetings: {
          select: { id: true },
          where: {
            endTime: null,
          },
          orderBy: {
            startTime: "desc",
          },
          take: 1,
        },
      },
      where: {
        isActive: true,
      },
    });

    return residents.map((resident) => ({
      ..._.omit(resident, ["meetings"]),
      activeMeetingId: resident.meetings[0]?.id ?? null,
    }));
  }),
});
