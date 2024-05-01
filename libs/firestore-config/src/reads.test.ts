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
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "@firebase/firestore";
import {
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import {
  ETL_COLLECTION_NAMES,
  getAnonUser,
  getNDUser,
  getRecidivizUser,
  getStatelessUser,
  getTNUser,
  PERSONAL_UPDATE_COLLECTION_NAME,
  SHARED_UPDATE_COLLECTION_NAMES,
  startTestEnv,
} from "./testUtils";
import { AssertFn, FirestoreInstance } from "./types";

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

async function testAllReadsUnrestricted(
  db: FirestoreInstance,
  assertFn: AssertFn,
) {
  return Promise.all([
    ...ETL_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
    ...SHARED_UPDATE_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
  ]);
}

async function testAllReadsForState(
  db: FirestoreInstance,
  assertFn: AssertFn,
  stateCode: string,
) {
  return Promise.all([
    ...ETL_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(
        getDocs(
          query(
            collection(db, collectionName),
            where("stateCode", "==", stateCode),
          ),
        ),
      );
    }),
    ...SHARED_UPDATE_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(
        getDoc(doc(collection(db, collectionName), `${stateCode}_12345`)),
      );
    }),
  ]);
}

test.each([
  ["anon", getAnonUser],
  ["stateless", getStatelessUser],
  ["ND", getNDUser],
  ["TN", getTNUser],
])("%s user cannot read unrestricted", async (userType, getUserContext) => {
  await testAllReadsUnrestricted(
    getUserContext(testEnv).firestore(),
    assertFails,
  );
});

test.each([
  ["anon", getAnonUser],
  ["stateless", getStatelessUser],
])("%s user cannot read state data", async (userType, getUserContext) => {
  await testAllReadsForState(
    getUserContext(testEnv).firestore(),
    assertFails,
    "US_TN",
  );
});

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

test.each([["us_nd", getNDUser, "us_tn", getTNUser]])(
  "%s can read their own userUpdates",
  async (userState, getUserContext) => {
    await assertSucceeds(
      getDoc(
        doc(
          collection(
            getUserContext(testEnv).firestore(),
            PERSONAL_UPDATE_COLLECTION_NAME,
          ),
          `user@${userState}.gov`,
        ),
      ),
    );
  },
);

test.each([["us_nd", getNDUser, "us_tn", getTNUser]])(
  "%s cannot read other users' userUpdates",
  async (userState, getUserContext) => {
    await assertFails(
      getDoc(
        doc(
          collection(
            getUserContext(testEnv).firestore(),
            PERSONAL_UPDATE_COLLECTION_NAME,
          ),
          `other_user@${userState}.gov`,
        ),
      ),
    );
  },
);
