// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

import {
  ETL_COLLECTION_NAMES,
  getAnonUser,
  getImpersonatedUser,
  getNDUser,
  getRecidivizUser,
  getStatelessUser,
  getTNUser,
  PERSONAL_UPDATE_COLLECTION_NAME,
  SHARED_UPDATE_COLLECTION_NAMES,
  startTestEnv,
} from "./testUtils";

let testEnv;

function testWriteToCollectionsWithoutStateCodePrefix(
  collectionNames,
  db,
  assertFn,
) {
  return Promise.all(
    collectionNames.map((collectionName) =>
      // eslint-disable-next-line no-restricted-syntax
      assertFn(setDoc(doc(db, collectionName, "foo"), {})),
    ),
  );
}

function testWriteToCollectionsForStateWithStateCodePrefix(
  collectionNames,
  db,
  assertFn,
  stateCode,
) {
  return Promise.all(
    collectionNames.map((collectionName) =>
      // eslint-disable-next-line no-restricted-syntax
      assertFn(setDoc(doc(db, collectionName, `${stateCode}_someID`), {})),
    ),
  );
}

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

test.each([
  ["anon", getAnonUser],
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

test.each([
  ["anon", getAnonUser],
  ["stateless", getStatelessUser],
])("%s user cannot write", async (userType, getUserContext) => {
  await testWriteToCollectionsWithoutStateCodePrefix(
    SHARED_UPDATE_COLLECTION_NAMES,
    getUserContext(testEnv).firestore(),
    assertFails,
  );
});

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

test.each([
  ["us_tn", getTNUser],
  ["us_nd", getNDUser],
])(
  "%s user can write to their own personal update collection",
  async (userState, getUserContext) => {
    await assertSucceeds(
      // eslint-disable-next-line no-restricted-syntax
      setDoc(
        doc(
          getUserContext(testEnv).firestore(),
          PERSONAL_UPDATE_COLLECTION_NAME,
          `user@${userState}.gov`,
        ),
        {},
      ),
    );
  },
);

test.each([
  ["us_tn", getTNUser],
  ["us_nd", getNDUser],
])(
  "%s user cannot write to another user's personal update collection",
  async (userState, getUserContext) => {
    await assertFails(
      // eslint-disable-next-line no-restricted-syntax
      setDoc(
        doc(
          getUserContext(testEnv).firestore(),
          PERSONAL_UPDATE_COLLECTION_NAME,
          `otherUser@${userState}.gov`,
        ),
        {},
      ),
    );
  },
);

test("impersonating user cannot write to collections", async () => {
  await testWriteToCollectionsForStateWithStateCodePrefix(
    SHARED_UPDATE_COLLECTION_NAMES,
    getImpersonatedUser(testEnv).firestore(),
    assertFails,
    "US_TN",
  );
});

test("impersonating user cannot write to personal update collection", async () => {
  await testWriteToCollectionsWithoutStateCodePrefix(
    [PERSONAL_UPDATE_COLLECTION_NAME],
    getImpersonatedUser(testEnv).firestore(),
    assertFails,
    "US_TN",
  );
});
