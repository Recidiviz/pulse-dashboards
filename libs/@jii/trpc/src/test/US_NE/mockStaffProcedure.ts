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

import { AuthorizedStaffUserContext } from "../../procedures/firebaseAuthedStaffProcedure";
import { baseProcedure } from "../../procedures/init";
import { usNeMeetingsStaffRouter } from "../../router/routes/meetingsStaff/states/US_NE/router";
import { userId } from "../context";
import { testPrismaClient } from "../prisma";

// This is mostly the same as in US_NC/mockStaffProcedure
vi.mock("../../procedures/firebaseAuthedStaffProcedure", () => {
  return {
    firebaseAuthedStaffProcedure: baseProcedure.use((opts) => {
      return opts.next({
        ctx: {
          userId,
          userProfile: {
            app: "meetings",
            stateCode: "US_NE",
            recidivizAllowedStates: [],
            impersonator: false,
          },
          stateCode: "US_NE",
          prisma: testPrismaClient,
        } satisfies AuthorizedStaffUserContext,
      });
    }),
  };
});

// we are mocking the procedure's context so it doesn't really matter what we pass here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const caller = usNeMeetingsStaffRouter.createCaller({ req: {} as any });
