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
import { usNcStaffRouter } from "../../router/routes/staff/states/US_NC/router";
import { userId } from "../context";
import { testPrismaClient } from "../prisma";

const mocks = vi.hoisted(() => {
  return { mockCollectionQuerier: vi.fn() };
});
vi.mock("../../procedures/firebaseAuthedStaffProcedure", () => {
  return {
    // the real procedure depends on third party services such as Firebase
    // to create a context for authorized users; this just mocks that result
    // for a standardized test user
    firebaseAuthedStaffProcedure: baseProcedure.use((opts) => {
      return opts.next({
        ctx: {
          userId,
          userProfile: {
            app: "staff",
            stateCode: "US_NC",
            recidivizAllowedStates: [],
            impersonator: false,
          },
          stateCode: "US_NC",
          prisma: testPrismaClient,
          firestoreCurrentStateQuerier: mocks.mockCollectionQuerier,
        } satisfies AuthorizedStaffUserContext,
      });
    }),
  };
});

// we are mocking the procedure's context so it doesn't really matter what we pass here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const caller = usNcStaffRouter.createCaller({ req: {} as any });

export const mockCollectionQuerier = mocks.mockCollectionQuerier;
