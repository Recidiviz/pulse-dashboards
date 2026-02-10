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
import {
  checkboxAnswers,
  lifeAreaAnswers,
  textAnswers,
} from "../../../../../test/fixtures/US_NC/rna";
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
          firestoreCurrentStateQuerier: vi.fn(),
        } satisfies AuthorizedStaffUserContext,
      });
    }),
  };
});

// we are mocking the procedure's context so it doesn't really matter what we pass here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const c = usNcStaffRouter.createCaller({ req: {} as any });

const testResidentId = "abc123";

test("no result", async () => {
  await expect(
    c.getRNA({ pseudonymizedId: testResidentId }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[TRPCError: No assessment data could be found for this resident (ID: abc123)]`,
  );
});

test("completed assessment", async () => {
  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {
        ...textAnswers,
        ...lifeAreaAnswers,
        ...checkboxAnswers,
      },
      completed: true,
    },
  });

  const result = await c.getRNA({ pseudonymizedId: testResidentId });
  expect(result).toEqual({
    status: "COMPLETE",
    textAnswers,
    checkboxAnswers,
    lifeAreaAnswers,
  });
});

test("in progress assessment", async () => {
  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      // this is not entirely realistic, what matters is that it's not empty
      answers: {
        ...lifeAreaAnswers,
      },
    },
  });

  const result = await c.getRNA({ pseudonymizedId: testResidentId });
  expect(result).toEqual({
    status: "IN_PROGRESS",
    lifeAreaAnswers,
    checkboxAnswers: {},
    textAnswers: {},
  });
});

test("not started assessment", async () => {
  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {},
    },
  });

  const result = await c.getRNA({ pseudonymizedId: testResidentId });
  expect(result).toEqual({
    status: "NOT_STARTED",
    checkboxAnswers: {},
    textAnswers: {},
    lifeAreaAnswers: {},
  });
});
