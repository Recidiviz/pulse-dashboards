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
import { getDocs } from "firebase/firestore";

import {
  ADMIN_COLLECTION_NAMES,
  ETL_COLLECTION_NAMES,
  getAnonUser,
  getOutOfStateUser,
  getRecidivizUser,
  getStatelessUser,
  getTNUser,
  startTestEnv,
  UPDATE_COLLECTION_NAMES,
} from "./testUtils";

let testEnv;

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

async function testAllReads(db, assertFn) {
  return Promise.all([
    ...ETL_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
    ...ADMIN_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
    ...UPDATE_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
  ]);
}

test.each([
  ["anon", getAnonUser],
  ["stateless", getStatelessUser],
  ["other state", getOutOfStateUser],
])("%s user cannot read", async (userType, getUserContext) => {
  await testAllReads(getUserContext(testEnv).firestore(), assertFails);
});

test.each([
  ["TN", getTNUser],
  ["Recidiviz", getRecidivizUser],
])("%s user can read", async (userType, getUserContext) => {
  await testAllReads(getUserContext(testEnv).firestore(), assertSucceeds);
});
