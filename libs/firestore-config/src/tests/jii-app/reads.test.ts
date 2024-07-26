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

import { AssertFn, FirestoreInstance } from "../types";
import {
  ETL_COLLECTION_NAMES,
  SHARED_UPDATE_COLLECTION_NAMES,
  startTestEnv,
  testAllReadsForState,
  testAllReadsUnrestricted,
} from "../utils";
import { getEnhancedMEUser, getMEUser, getRecidivizUser } from "./utils";

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

function testList(
  db: FirestoreInstance,
  assertFn: AssertFn,
  collectionNames: Array<string>,
  stateCode?: string,
) {
  return Promise.all(
    collectionNames.map(async (collectionName) => {
      await assertFn(
        getDocs(
          stateCode
            ? query(
                collection(db, collectionName),
                where("stateCode", "==", stateCode),
              )
            : query(collection(db, collectionName)),
        ),
      );
    }),
  );
}

let db: FirestoreInstance;

describe("app = jii", () => {
  describe("Maine JII user", () => {
    beforeEach(() => {
      db = getMEUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read their own ETL documents", () => {
      return testGet(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read anyone else's ETL documents", () => {
      return testGet(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_other-user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read documents outside their state", () => {
      return testGet(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_xx_user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read staff collections if their IDs collide", () => {
      return testGet(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !!name.match(/staff/i)),
        "us_me_user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot query ETL documents for their state", async () => {
      return testList(db, assertFails, ETL_COLLECTION_NAMES, "US_ME");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read any updates, even those associated with their IDs", () => {
      return testGet(
        db,
        assertFails,
        SHARED_UPDATE_COLLECTION_NAMES,
        "us_me_user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot query any collections", async () => {
      await testAllReadsUnrestricted(db, assertFails);
      await testAllReadsForState(db, assertFails, "US_ME");
    });
  });

  describe("Maine enhanced permissions user", () => {
    beforeEach(() => {
      db = getEnhancedMEUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read anyone's ETL records in their state", async () => {
      await testGet(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_user",
      );

      await testGet(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_other-user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can query ETL records for their state", () => {
      return testList(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "US_ME",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read or query records outside their state", () => {
      return testList(db, assertFails, ETL_COLLECTION_NAMES, "US_XX");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read any updates", () => {
      return testGet(
        db,
        assertFails,
        SHARED_UPDATE_COLLECTION_NAMES,
        "us_me_user",
      );
    });
  });

  describe("Recidiviz user", () => {
    beforeEach(() => {
      db = getRecidivizUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("Recidiviz user can query collections and read updates", async () => {
      await testAllReadsForState(db, assertSucceeds, "US_ME");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("Recidiviz user can read anyone's ETL documents", async () => {
      await testGet(db, assertSucceeds, ETL_COLLECTION_NAMES, "us_me_user");

      await testGet(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES,
        "us_me_other-user",
      );
    });
  });
});
