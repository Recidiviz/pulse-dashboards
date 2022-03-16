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

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

let testEnv;

const COLLECTION_NAMES = ["staff", "userUpdates", "clients", "clientUpdates"];

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-test",
    firestore: {
      rules: fs.readFileSync(
        `${path.basename(__dirname)}/firestore.rules`,
        "utf8"
      ),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  // Clear the database between tests
  await testEnv.clearFirestore();
});

async function testGlobalQuery(db, assertFn) {
  return Promise.all(
    COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    })
  );
}

async function testStateQuery(db, assertFn) {
  return Promise.all(
    COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(
        getDocs(db.collection(collectionName).where("stateCode", "==", "US_XX"))
      );
    })
  );
}

async function expectAllFail(userContext) {
  const db = userContext.firestore();

  await testGlobalQuery(db, assertFails);

  await testStateQuery(db, assertFails);
}

test("unauthenticated user cannot read", async () => {
  await expectAllFail(testEnv.unauthenticatedContext());
});

test("state code required to read", async () => {
  await expectAllFail(testEnv.authenticatedContext("foo"));
});

test("user cannot read outside their state", async () => {
  await expectAllFail(
    testEnv.authenticatedContext("foo", {
      stateCode: "US_YY",
    })
  );
});

test("user can read anything in their state", async () => {
  const userContext = testEnv.authenticatedContext("foo", {
    stateCode: "US_XX",
  });
  const db = userContext.firestore();

  await testStateQuery(db, assertSucceeds);

  await testGlobalQuery(db, assertFails);
});

test("recidiviz state code grants universal access", async () => {
  const userContext = testEnv.authenticatedContext("admin", {
    stateCode: "recidiviz",
  });
  const db = userContext.firestore();

  await testStateQuery(db, assertSucceeds);

  await testGlobalQuery(db, assertSucceeds);
});
