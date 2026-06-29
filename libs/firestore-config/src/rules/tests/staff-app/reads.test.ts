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
  seedClientOpportunityUpdate,
  startTestEnv,
  testAllQueriesUnrestricted,
  testAllReadsForState,
  testCollectionGroupOpportunityUpdateRead,
  testReadCustomTaskForState,
  testUserUpdateRead,
} from "../utils";
import {
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
    ["stateless", getStatelessUser],
    ["ND", getNDUser],
    ["TN", getTNUser],
  ])("%s user cannot read unrestricted", async (userType, getUserContext) => {
    await testAllQueriesUnrestricted(
      getUserContext(testEnv).firestore(),
      assertFails,
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each([["stateless", getStatelessUser]])(
    "%s user cannot read state data",
    async (userType, getUserContext) => {
      await testAllReadsForState(
        getUserContext(testEnv).firestore(),
        assertFails,
        "US_TN",
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
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

  // eslint-disable-next-line vitest/expect-expect
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

  // eslint-disable-next-line vitest/expect-expect
  test.each([["CA"], ["PA"]])(
    "Recidiviz user can read demo %s state data even if it is not in recidivizAllowedStates",
    async (userState) => {
      await testAllReadsForState(
        getRecidivizUser(testEnv).firestore(),
        assertSucceeds,
        `US_${userState}`,
        "DEMO_",
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
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

  // eslint-disable-next-line vitest/expect-expect
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

  // eslint-disable-next-line vitest/expect-expect
  test.each([["us_nd", getNDUser, "us_tn", getTNUser]])(
    "%s can read their own userUpdates",
    async (userState, getUserContext) => {
      await testUserUpdateRead(
        getUserContext(testEnv).firestore(),
        assertSucceeds,
        `user@${userState}.gov`,
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([["us_nd", getNDUser, "us_tn", getTNUser]])(
    "%s cannot read other users' userUpdates",
    async (userState, getUserContext) => {
      await testUserUpdateRead(
        getUserContext(testEnv).firestore(),
        assertFails,
        `other_user@${userState}.gov`,
      );
    },
  );

  describe("clientOpportunityUpdates (collectionGroup)", () => {
    beforeEach(async () => {
      // Seed one document per state so rules are evaluated against real data.
      await seedClientOpportunityUpdate(testEnv, "US_TN");
      await seedClientOpportunityUpdate(testEnv, "US_ND");
      await seedClientOpportunityUpdate(testEnv, "US_CA");
      await seedClientOpportunityUpdate(testEnv, "US_PA");
    });

    // eslint-disable-next-line vitest/expect-expect
    test.each([
      ["TN", getTNUser],
      ["ND", getNDUser],
    ])(
      "%s user can query clientOpportunityUpdates for their own state",
      async (userState, getUserContext) => {
        await testCollectionGroupOpportunityUpdateRead(
          getUserContext(testEnv).firestore(),
          assertSucceeds,
          `US_${userState}`,
        );
      },
    );

    // eslint-disable-next-line vitest/expect-expect
    test.each([
      ["TN", getTNUser, "ND"],
      ["ND", getNDUser, "TN"],
    ])(
      "%s user cannot query clientOpportunityUpdates for a different state",
      async (_userState, getUserContext, otherState) => {
        await testCollectionGroupOpportunityUpdateRead(
          getUserContext(testEnv).firestore(),
          assertFails,
          `US_${otherState}`,
        );
      },
    );

    // eslint-disable-next-line vitest/expect-expect
    test("stateless user cannot query clientOpportunityUpdates", async () => {
      await testCollectionGroupOpportunityUpdateRead(
        getStatelessUser(testEnv).firestore(),
        assertFails,
        "US_TN",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test.each([["TN"], ["ND"]])(
      "Recidiviz user can query %s clientOpportunityUpdates from recidivizAllowedStates",
      async (userState) => {
        await testCollectionGroupOpportunityUpdateRead(
          getRecidivizUser(testEnv).firestore(),
          assertSucceeds,
          `US_${userState}`,
        );
      },
    );

    // eslint-disable-next-line vitest/expect-expect
    test.each([["CA"], ["PA"]])(
      "Recidiviz user cannot query %s clientOpportunityUpdates if not in recidivizAllowedStates",
      async (userState) => {
        await testCollectionGroupOpportunityUpdateRead(
          getRecidivizUser(testEnv).firestore(),
          assertFails,
          `US_${userState}`,
        );
      },
    );
  });

  describe("clientUpdatesV2/{clientId}/custom_tasks/{taskId}", () => {
    // The recursive rule on clientUpdatesV2 covers this subcollection; these
    // tests confirm the stateCode-prefix policy still gates reads from it.
    // eslint-disable-next-line vitest/expect-expect
    test.each([
      ["TN", getTNUser],
      ["ND", getNDUser],
    ])(
      "%s user can read a custom task on their own state's client",
      async (userType, getUserContext) => {
        await testReadCustomTaskForState(
          getUserContext(testEnv).firestore(),
          assertSucceeds,
          `US_${userType}`,
        );
      },
    );

    // eslint-disable-next-line vitest/expect-expect
    test.each([
      ["TN", getTNUser, "ND"],
      ["ND", getNDUser, "TN"],
    ])(
      "%s user cannot read a custom task on a cross-state client",
      async (_userType, getUserContext, otherState) => {
        await testReadCustomTaskForState(
          getUserContext(testEnv).firestore(),
          assertFails,
          `US_${otherState}`,
        );
      },
    );

    // eslint-disable-next-line vitest/expect-expect
    test("stateless user cannot read a custom task", async () => {
      await testReadCustomTaskForState(
        getStatelessUser(testEnv).firestore(),
        assertFails,
        "US_TN",
      );
    });

    // eslint-disable-next-line vitest/expect-expect
    test.each([["TN"], ["ND"]])(
      "Recidiviz user can read %s custom tasks from recidivizAllowedStates",
      async (userState) => {
        await testReadCustomTaskForState(
          getRecidivizUser(testEnv).firestore(),
          assertSucceeds,
          `US_${userState}`,
        );
      },
    );
  });
});
