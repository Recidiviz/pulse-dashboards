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
  ETL_COLLECTION_NAMES,
  PERSONAL_UPDATE_COLLECTION_NAME,
  SHARED_UPDATE_COLLECTION_NAMES,
  startTestEnv,
  testWriteToCollectionsForStateWithStateCodePrefix,
  testWriteToCollectionsWithoutStateCodePrefix,
  testWriteToPersonalUpdateCollection,
} from "../utils";
import {
  getImpersonatedUser,
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
    ["stateless user", getStatelessUser],
    ["state user", getTNUser],
    ["ND user", getNDUser],
    ["TN user", getTNUser],
    ["Recidiviz user", getRecidivizUser],
  ])(
    "ETL and admin data is read-only for %s",
    async (userType, getUserContext) => {
      await testWriteToCollectionsWithoutStateCodePrefix(
        [...ETL_COLLECTION_NAMES],
        getUserContext(testEnv).firestore(),
        assertFails,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["stateless", getStatelessUser]])(
    "%s user cannot write",
    async (userType, getUserContext) => {
      await testWriteToCollectionsWithoutStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getUserContext(testEnv).firestore(),
        assertFails,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["ND", getNDUser],
    ["TN", getTNUser],
    ["Recidiviz", getRecidivizUser],
  ])(
    "%s user cannot write without proper recordID format",
    async (userType, getUserContext) => {
      await testWriteToCollectionsWithoutStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getUserContext(testEnv).firestore(),
        assertFails,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["Recidiviz", getRecidivizUser],
    ["TN", getTNUser],
  ])("%s user can write TN data", async (userType, getUserContext) => {
    await testWriteToCollectionsForStateWithStateCodePrefix(
      SHARED_UPDATE_COLLECTION_NAMES,
      getUserContext(testEnv).firestore(),
      assertSucceeds,
      "US_TN",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["Recidiviz", getRecidivizUser],
    ["ND", getNDUser],
  ])("%s user can write ND data", async (userType, getUserContext) => {
    await testWriteToCollectionsForStateWithStateCodePrefix(
      SHARED_UPDATE_COLLECTION_NAMES,
      getUserContext(testEnv).firestore(),
      assertSucceeds,
      "US_ND",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["TN", getTNUser, "ND"],
    ["ND", getNDUser, "TN"],
  ])(
    "%s user cannot write cross-state data",
    async (userType, getUserContext, state) => {
      await testWriteToCollectionsForStateWithStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getUserContext(testEnv).firestore(),
        assertFails,
        `US_${state}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["TN", getTNUser, "ND", getNDUser],
    ["ND", getNDUser, "TN", getTNUser],
  ])(
    "%s user cannot overwrite another state's data",
    async (userState, getUserContext, otherUserState, getOtherUserContext) => {
      await testWriteToCollectionsForStateWithStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getOtherUserContext(testEnv).firestore(),
        assertSucceeds,
        `US_${otherUserState}`,
      );

      await testWriteToCollectionsForStateWithStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getUserContext(testEnv).firestore(),
        assertFails,
        `US_${otherUserState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["TN", getTNUser],
    ["ND", getNDUser],
  ])(
    "Recidiviz user can overwrite %s data",
    async (otherUserState, getOtherUserContext) => {
      await testWriteToCollectionsForStateWithStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getOtherUserContext(testEnv).firestore(),
        assertSucceeds,
        `US_${otherUserState}`,
      );

      await testWriteToCollectionsForStateWithStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getRecidivizUser(testEnv).firestore(),
        assertSucceeds,
        `US_${otherUserState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["PA"], ["CA"]])(
    "Recidiviz user cannot write to %s data if it is not in recidivizAllowedStates",
    async (userState) => {
      await testWriteToCollectionsForStateWithStateCodePrefix(
        SHARED_UPDATE_COLLECTION_NAMES,
        getRecidivizUser(testEnv).firestore(),
        assertFails,
        `US_${userState}`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["us_tn", getTNUser],
    ["us_nd", getNDUser],
  ])(
    "%s user can write to their own personal update collection",
    async (userState, getUserContext) => {
      await testWriteToPersonalUpdateCollection(
        getUserContext(testEnv).firestore(),
        assertSucceeds,
        `user@${userState}.gov`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["us_tn", getTNUser],
    ["us_nd", getNDUser],
  ])(
    "%s user cannot write to another user's personal update collection",
    async (userState, getUserContext) => {
      await testWriteToPersonalUpdateCollection(
        getUserContext(testEnv).firestore(),
        assertFails,
        `otherUser@${userState}.gov`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test("impersonating user cannot write to collections", async () => {
    await testWriteToCollectionsForStateWithStateCodePrefix(
      SHARED_UPDATE_COLLECTION_NAMES,
      getImpersonatedUser(testEnv).firestore(),
      assertFails,
      "US_TN",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("impersonating user cannot write to personal update collection", async () => {
    await testWriteToCollectionsWithoutStateCodePrefix(
      [PERSONAL_UPDATE_COLLECTION_NAME],
      getImpersonatedUser(testEnv).firestore(),
      assertFails,
    );
  });
});
