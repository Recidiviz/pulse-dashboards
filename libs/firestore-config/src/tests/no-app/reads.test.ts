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
  startTestEnv,
  testAllReadsForState,
  testAllReadsUnrestricted,
  testUserUpdateRead,
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
  test.each([
    ["anon", getAnonUser, "user@us_tn.gov"],
    ["TN", getTNUser, "user@us_tn.gov"],
    ["Recidiviz", getRecidivizUser, "user@recidiviz.org"],
  ])(
    "%s user cannot read anything",
    async (userType, getUserContext, email) => {
      const db = getUserContext(testEnv).firestore();

      await testAllReadsUnrestricted(db, assertFails);

      await testAllReadsForState(db, assertFails, "US_TN");

      await testUserUpdateRead(db, assertFails, email);
    },
  );
});
