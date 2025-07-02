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
  DEMO_ETL_COLLECTION_NAMES,
  ETL_COLLECTION_NAMES,
  SHARED_UPDATE_COLLECTION_NAMES,
  startTestEnv,
  testAllETLReadsForState,
  testAllReadsForState,
  testAllReadsUnrestricted,
} from "../utils";
import {
  getDemoMEUser,
  getDemoRecidivizUser,
  getEnhancedDemoMEUser,
  getEnhancedMEUser,
  getMEUser,
  getMultistateUser,
  getRecidivizUser,
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

function testPseudoIdQuery(
  db: FirestoreInstance,
  assertFn: AssertFn,
  collectionNames: Array<string>,
  stateCode: string,
  pseudoId: string,
) {
  return Promise.all([
    ...collectionNames.map(async (collectionName) => {
      await assertFn(
        getDocs(
          query(
            collection(db, collectionName),
            where("stateCode", "==", stateCode),
            where("pseudonymizedId", "==", pseudoId),
          ),
        ),
      );
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
    test("can read their own ETL documents", async () => {
      await testGet(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_user",
      );

      await testPseudoIdQuery(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "US_ME",
        "pid-user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read anyone else's ETL documents", async () => {
      await testGet(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_other-user",
      );

      await testPseudoIdQuery(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "US_ME",
        "pid-other-user",
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
    test("can query all ETL collections", async () => {
      await testAllETLReadsForState(db, assertSucceeds, "US_ME");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read anyone's ETL documents", async () => {
      await testGet(db, assertSucceeds, ETL_COLLECTION_NAMES, "us_me_user");

      await testGet(
        db,
        assertSucceeds,
        ETL_COLLECTION_NAMES,
        "us_me_other-user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read data from demo ETL collections", async () => {
      await testAllETLReadsForState(db, assertSucceeds, "US_ME", "DEMO_");
    });
  });

  describe("Maine demo user", () => {
    beforeEach(() => {
      db = getDemoMEUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read their own data from demo ETL collections", () => {
      return testGet(
        db,
        assertSucceeds,
        DEMO_ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_demouser",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read demo documents outside their state", () => {
      return testGet(
        db,
        assertFails,
        DEMO_ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_xx_demouser",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read data from live ETL collections, even if it matches their ID", () => {
      return testGet(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_demouser",
      );
    });
  });

  describe("Maine enhanced demo user", () => {
    beforeEach(() => {
      db = getEnhancedDemoMEUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read anyone's ETL records in their state", async () => {
      await testGet(
        db,
        assertSucceeds,
        DEMO_ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_user",
      );

      await testGet(
        db,
        assertSucceeds,
        DEMO_ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_other-user",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can query ETL records for their state", () => {
      return testList(
        db,
        assertSucceeds,
        DEMO_ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "US_ME",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read or query records outside their state", () => {
      return testList(db, assertFails, DEMO_ETL_COLLECTION_NAMES, "US_XX");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read demo documents outside their state", () => {
      return testGet(
        db,
        assertFails,
        DEMO_ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_xx_demouser",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read data from live ETL collections, even if it matches their ID", async () => {
      await testGet(
        db,
        assertFails,
        ETL_COLLECTION_NAMES.filter((name) => !name.match(/staff/i)),
        "us_me_demouser",
      );
      await testAllETLReadsForState(db, assertFails, "US_ME");
    });
  });

  describe("Recidiviz demo user", () => {
    beforeEach(() => {
      db = getDemoRecidivizUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read data from demo ETL collections", async () => {
      await testAllETLReadsForState(db, assertSucceeds, "US_ME", "DEMO_");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read anything from live collections", () => {
      return testAllReadsForState(db, assertFails, "US_ME");
    });
  });

  describe("Multi-state enhanced demo user", () => {
    beforeEach(() => {
      db = getMultistateUser(testEnv).firestore();
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read data from Maine demo ETL collections", async () => {
      await testAllETLReadsForState(db, assertSucceeds, "US_ME", "DEMO_");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("can read data from other state demo ETL collections", async () => {
      await testAllETLReadsForState(db, assertSucceeds, "US_XX", "DEMO_");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read data from third state demo ETL collections", async () => {
      await testAllETLReadsForState(db, assertFails, "US_YY", "DEMO_");
    });

    // eslint-disable-next-line vitest/expect-expect
    test("cannot read anything from live collections", () => {
      return testAllReadsForState(db, assertFails, "US_ME");
    });
  });
});
