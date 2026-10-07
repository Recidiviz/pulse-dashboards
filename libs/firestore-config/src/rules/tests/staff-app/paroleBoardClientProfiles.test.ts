// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
  setDoc,
  where,
} from "@firebase/firestore";
import {
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import { getEnhancedNDUser } from "../jii-app/utils";
import { AssertFn, FirestoreInstance } from "../types";
import { startTestEnv } from "../utils";
import {
  getCOParoleBoardUser,
  getCORecidivizUser,
  getCOUser,
  getDemoOnlyCOParoleBoardUser,
  getStatelessUser,
} from "./utils";

const PROFILES = "paroleBoardClientProfiles";
const DEMO_PROFILES = `DEMO_${PROFILES}`;

let testEnv: RulesTestEnvironment;

/** The document id the ETL gives a profile in this state. */
function profileDocId(stateCode: string) {
  return `${stateCode.toLowerCase()}_123`;
}

async function seedProfile(collectionName: string, stateCode: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), collectionName, profileDocId(stateCode)),
      { stateCode, pseudonymizedId: "pid123", demographics: {} },
    );
  });
}

/** Reads a profile both ways the app does: one doc, and a state query. */
async function testProfileReads(
  db: FirestoreInstance,
  assertFn: AssertFn,
  stateCode: string,
  collectionName = PROFILES,
) {
  await assertFn(getDoc(doc(db, collectionName, profileDocId(stateCode))));
  await assertFn(
    getDocs(
      query(
        collection(db, collectionName),
        where("stateCode", "==", stateCode),
      ),
    ),
  );
}

beforeAll(async () => {
  testEnv = await startTestEnv("staff-app-parole-board-client-profiles");
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  // US_CO is the users' own state and US_ID the other Parole Board state. US_ND
  // is seeded only for the enhanced JII user, whose helper is ND-only.
  await Promise.all(
    ["US_CO", "US_ID", "US_ND"].flatMap((stateCode) => [
      seedProfile(PROFILES, stateCode),
      seedProfile(DEMO_PROFILES, stateCode),
    ]),
  );
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe("paroleBoardClientProfiles", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("in-state staff user with Parole Board access can read", async () => {
    await testProfileReads(
      getCOParoleBoardUser(testEnv).firestore(),
      assertSucceeds,
      "US_CO",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("in-state staff user without Parole Board access cannot read", async () => {
    await testProfileReads(
      getCOUser(testEnv).firestore(),
      assertFails,
      "US_CO",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("staff user with Parole Board access cannot read another state", async () => {
    await testProfileReads(
      getCOParoleBoardUser(testEnv).firestore(),
      assertFails,
      "US_ID",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("staff user with Parole Board access cannot read a missing doc, so a denial does not reveal that a doc id exists", async () => {
    await assertFails(
      getDoc(
        doc(
          getCOParoleBoardUser(testEnv).firestore(),
          PROFILES,
          "us_co_does_not_exist",
        ),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("stateless user cannot read", async () => {
    await testProfileReads(
      getStatelessUser(testEnv).firestore(),
      assertFails,
      "US_CO",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can read a state in recidivizAllowedStates", async () => {
    await testProfileReads(
      getCORecidivizUser(testEnv).firestore(),
      assertSucceeds,
      "US_CO",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user cannot read a state outside recidivizAllowedStates", async () => {
    await testProfileReads(
      getCORecidivizUser(testEnv).firestore(),
      assertFails,
      "US_ID",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("enhanced JII user cannot read in their own state", async () => {
    await testProfileReads(
      getEnhancedNDUser(testEnv).firestore(),
      assertFails,
      "US_ND",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("staff user with Parole Board access cannot write", async () => {
    await assertFails(
      setDoc(doc(getCOParoleBoardUser(testEnv).firestore(), PROFILES, "x"), {
        stateCode: "US_CO",
      }),
    );
  });
});

describe("DEMO_paroleBoardClientProfiles", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("in-state staff user without Parole Board access cannot read", async () => {
    await testProfileReads(
      getCOUser(testEnv).firestore(),
      assertFails,
      "US_CO",
      DEMO_PROFILES,
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("demo-only user with Parole Board access can read demo profiles in their state", async () => {
    await testProfileReads(
      getDemoOnlyCOParoleBoardUser(testEnv).firestore(),
      assertSucceeds,
      "US_CO",
      DEMO_PROFILES,
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("demo-only user with Parole Board access cannot read real profiles", async () => {
    await testProfileReads(
      getDemoOnlyCOParoleBoardUser(testEnv).firestore(),
      assertFails,
      "US_CO",
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can read demo profiles outside recidivizAllowedStates", async () => {
    await testProfileReads(
      getCORecidivizUser(testEnv).firestore(),
      assertSucceeds,
      "US_ID",
      DEMO_PROFILES,
    );
  });
});
