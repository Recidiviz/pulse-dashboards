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

import {
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import {
  startTestEnv,
  testAllReadsForState,
  testAllReadsUnrestricted,
  testUserUpdateRead,
} from "../utils";
import {
  getNDUser,
  getRecidivizUser,
  getStatelessUser,
  getTNUser,
} from "./utils";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await startTestEnv();
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  // Clear the database between tests
  await testEnv.clearFirestore();
});

describe("app = staff", () => {
  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["stateless", getStatelessUser],
    ["ND", getNDUser],
    ["TN", getTNUser],
  ])("%s user cannot read unrestricted", async (userType, getUserContext) => {
    await testAllReadsUnrestricted(
      getUserContext(testEnv).firestore(),
      assertFails,
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each([["stateless", getStatelessUser]])(
    "%s user cannot read state data",
    async (userType, getUserContext) => {
      await testAllReadsForState(
        getUserContext(testEnv).firestore(),
        assertFails,
        "US_TN",
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["TN"], ["ND"]])(
    "Recidiviz user can read %s state data from recidivizAllowedStates",
    async (userState) => {
      await testAllReadsForState(
        getRecidivizUser(testEnv).firestore(),
        assertSucceeds,
        `US_${userState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["CA"], ["PA"]])(
    "Recidiviz user cannot read %s state data if it is not in recidivizAllowedStates",
    async (userState) => {
      await testAllReadsForState(
        getRecidivizUser(testEnv).firestore(),
        assertFails,
        `US_${userState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["TN", getTNUser],
    ["ND", getNDUser],
  ])(
    "%s user can read their own state data",
    async (userState, getUserContext) => {
      await testAllReadsForState(
        getUserContext(testEnv).firestore(),
        assertSucceeds,
        `US_${userState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["TN", getTNUser, "ND"],
    ["ND", getNDUser, "TN"],
  ])(
    "%s user cannot read cross-state data",
    async (userState, getUserContext, otherState) => {
      await testAllReadsForState(
        getUserContext(testEnv).firestore(),
        assertFails,
        `US_${otherState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["us_nd", getNDUser, "us_tn", getTNUser]])(
    "%s can read their own userUpdates",
    async (userState, getUserContext) => {
      await testUserUpdateRead(
        getUserContext(testEnv).firestore(),
        assertSucceeds,
        `user@${userState}.gov`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["us_nd", getNDUser, "us_tn", getTNUser]])(
    "%s cannot read other users' userUpdates",
    async (userState, getUserContext) => {
      await testUserUpdateRead(
        getUserContext(testEnv).firestore(),
        assertFails,
        `other_user@${userState}.gov`,
      );
    },
  );
});
