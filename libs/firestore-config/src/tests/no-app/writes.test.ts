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
import { getAnonUser, getRecidivizUser, getTNUser } from "./utils";

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

describe("no app specified", () => {
  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["TN", getTNUser, "user@us_tn.gov"],
    ["Recidiviz", getRecidivizUser, "user@recidiviz.org"],
    ["anon", getAnonUser, "user@us_tn.gov"],
  ])(
    "%s user cannot write anything",
    async (userType, getUserContext, email) => {
      const db = getUserContext(testEnv).firestore();

      await testWriteToCollectionsWithoutStateCodePrefix(
        [...ETL_COLLECTION_NAMES],
        db,
        assertFails,
      );
      await testWriteToCollectionsWithoutStateCodePrefix(
        [...SHARED_UPDATE_COLLECTION_NAMES],
        db,
        assertFails,
      );
      await testWriteToCollectionsWithoutStateCodePrefix(
        [PERSONAL_UPDATE_COLLECTION_NAME],
        db,
        assertFails,
      );

      await testWriteToCollectionsForStateWithStateCodePrefix(
        [...SHARED_UPDATE_COLLECTION_NAMES],
        db,
        assertFails,
        "US_TN",
      );

      await testWriteToPersonalUpdateCollection(db, assertFails, email);
    },
  );
});
