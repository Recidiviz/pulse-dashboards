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

import { collection, doc, getDoc } from "@firebase/firestore";
import {
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import { AssertFn, FirestoreInstance } from "../types";
import {
  ETL_COLLECTION_NAMES,
  SHARED_UPDATE_COLLECTION_NAMES,
  startTestEnv,
  testAllReadsForState,
  testAllReadsUnrestricted,
} from "../utils";
import { getMEUser, getRecidivizUser } from "./utils";

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

function testGet(
  db: FirestoreInstance,
  assertFn: AssertFn,
  collectionNames: Array<string>,
  docId: string,
) {
  return Promise.all([
    ...collectionNames.map(async (collectionName) => {
      await assertFn(getDoc(doc(collection(db, collectionName), docId)));
    }),
  ]);
}

describe("app = jii", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("user can read their own ETL documents", () => {
    return testGet(
      getMEUser(testEnv).firestore(),
      assertSucceeds,
      ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
      "us_me_user",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("user cannot read anyone else's ETL documents", () => {
    return testGet(
      getMEUser(testEnv).firestore(),
      assertFails,
      ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
      "us_me_other-user",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("user cannot read documents outside their state", () => {
    return testGet(
      getMEUser(testEnv).firestore(),
      assertFails,
      ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
      "us_xx_user",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("user cannot read staff collections if their IDs collide", () => {
    return testGet(
      getMEUser(testEnv).firestore(),
      assertFails,
      ETL_COLLECTION_NAMES.filter((name) => !!name.match(/staff/i)),
      "us_me_user",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("user cannot read any updates, even those associated with their IDs", () => {
    return testGet(
      getMEUser(testEnv).firestore(),
      assertFails,
      SHARED_UPDATE_COLLECTION_NAMES,
      "us_me_user",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("user cannot query any collections", async () => {
    const db = getMEUser(testEnv).firestore();
    await testAllReadsUnrestricted(db, assertFails);
    await testAllReadsForState(db, assertFails, "US_ME");
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can query collections and read updates", async () => {
    const db = getRecidivizUser(testEnv).firestore();
    await testAllReadsForState(db, assertSucceeds, "US_ME");
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can read anyone's ETL documents", async () => {
    const db = getRecidivizUser(testEnv).firestore();

    await testGet(db, assertSucceeds, ETL_COLLECTION_NAMES, "us_me_user");

    await testGet(db, assertSucceeds, ETL_COLLECTION_NAMES, "us_me_other-user");
  });
});
