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

import type { AuthorizedStaffUserContext } from "../../../../../procedures/firebaseAuthedStaffProcedure";
import { baseProcedure } from "../../../../../procedures/init";
import { userId } from "../../../../../test/context";
import { testPrismaClient } from "../../../../../test/prisma";
import { usNcStaffRouter } from "./router";

vi.mock("../../../../../procedures/firebaseAuthedStaffProcedure", () => {
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
        } satisfies AuthorizedStaffUserContext,
      });
    }),
  };
});

// we are mocking the procedure's context so it doesn't really matter what we pass here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const c = usNcStaffRouter.createCaller({ req: {} as any });

const testIds = ["abc", "def"];

const testInput = { pseudonymizedIds: testIds };

describe("rnaStatusList", () => {
  test("no result", async () => {
    expect(await c.rnaStatusList(testInput)).toEqual([]);
  });

  test("latest records matching IDs", async () => {
    // seed DB
    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testIds[0],
          // this wouldn't normally be specified but we are controlling it for the test
          updatedAt: new Date(2026, 1, 1),
          // for this query we don't care about the answer data
          answers: {},
        },
        // this one is old and should be omitted from the results
        {
          pseudonymizedId: testIds[1],
          updatedAt: new Date(2026, 1, 1),
          answers: {},
        },
        {
          pseudonymizedId: testIds[1],
          updatedAt: new Date(2026, 1, 2),
          answers: {},
        },
        // this should be filtered out by the input IDs
        {
          pseudonymizedId: "some-other-id",
          updatedAt: new Date(2026, 1, 1),
          answers: {},
        },
      ],
    });

    expect(await c.rnaStatusList(testInput)).toEqual(
      // results are not sorted and don't really need to be
      expect.arrayContaining([
        {
          completed: false,
          pseudonymizedId: "abc",
          updatedAt: new Date(2026, 1, 1),
        },
        {
          completed: false,
          pseudonymizedId: "def",
          updatedAt: new Date(2026, 1, 2),
        },
      ]),
    );

    // reset DB
    await testPrismaClient.usNcRNA.deleteMany({});
  });
});
