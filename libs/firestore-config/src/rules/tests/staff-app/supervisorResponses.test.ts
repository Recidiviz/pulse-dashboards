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

// Every test here asserts through assertSucceeds or assertFails, which the
// rule does not count as an assertion.
/* eslint-disable vitest/expect-expect */

import {
  deleteField,
  doc,
  DocumentData,
  setDoc,
  Timestamp,
} from "@firebase/firestore";
import {
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import { FirestoreInstance } from "../types";
import { startTestEnv } from "../utils";

const OFFICER_EMAIL = "officer@recidiviz.org";
const SUPERVISOR_EMAIL = "supervisor@recidiviz.org";
const CLIENT_ID = "us_tn_123";
const OPPORTUNITY_DOC_ID = "usTnSomeOpportunity";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await startTestEnv("staff-app-supervisor-responses");
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

function getStaffUser(email: string) {
  return testEnv
    .authenticatedContext(email, {
      app: "staff",
      stateCode: "US_TN",
      impersonator: false,
      recidivizAllowedStates: [],
    })
    .firestore();
}

const getOfficer = () => getStaffUser(OFFICER_EMAIL);
const getSupervisor = () => getStaffUser(SUPERVISOR_EMAIL);

function opportunityPath(collectionPrefix = "") {
  return `${collectionPrefix}clientUpdatesV2/${CLIENT_ID}/clientOpportunityUpdates/${OPPORTUNITY_DOC_ID}`;
}

/** An officer request, shaped as `setOfficerAction` writes it. */
function officerRequest(
  byUid: string | undefined,
  day: number,
  overrides: DocumentData = {},
): DocumentData {
  return {
    type: "DENIAL",
    denialReasons: ["SOME REASON"],
    by: "Officer Name",
    updateById: "OFFICER_ID",
    date: Timestamp.fromDate(new Date(2026, 0, day)),
    isStale: false,
    ...(byUid && { byUid }),
    ...overrides,
  };
}

/** A supervisor response, shaped as `setSupervisorResponse` writes it. */
function supervisorResponse(
  byUid: string | undefined,
  type = "APPROVAL",
): DocumentData {
  return {
    type,
    by: "Supervisor Name",
    updateById: "SUPERVISOR_ID",
    date: Timestamp.fromDate(new Date(2026, 1, 1)),
    ...(byUid && { byUid }),
  };
}

function withResponse(request: DocumentData, response: DocumentData) {
  return { ...request, supervisorResponse: response };
}

async function seedActionHistory(
  actionHistory: DocumentData[],
  collectionPrefix = "",
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), opportunityPath(collectionPrefix)), {
      stateCode: "US_TN",
      actionHistory,
    });
  });
}

/** Writes the whole list, merged into the doc, as `updateOpportunityActionHistory` does. */
function writeActionHistory(
  db: FirestoreInstance,
  actionHistory: DocumentData[],
  collectionPrefix = "",
) {
  return setDoc(
    doc(db, opportunityPath(collectionPrefix)),
    { stateCode: "US_TN", actionHistory },
    { merge: true },
  );
}

// Seeded history: an approved request, then one awaiting review. Neither
// carries `byUid`, as data written before the rule does not.
const approvedLegacyRequest = withResponse(
  officerRequest(undefined, 1),
  supervisorResponse(undefined, "DENIAL"),
);
const pendingLegacyRequest = officerRequest(undefined, 2);
const legacyHistory = [approvedLegacyRequest, pendingLegacyRequest];

describe("app = staff, clientOpportunityUpdates actionHistory", () => {
  describe("legitimate writes", () => {
    test("an officer can make the first request", async () => {
      await assertSucceeds(
        writeActionHistory(getOfficer(), [officerRequest(OFFICER_EMAIL, 1)]),
      );
    });

    test("an officer can append a request to existing history", async () => {
      await seedActionHistory(legacyHistory);
      await assertSucceeds(
        writeActionHistory(getOfficer(), [
          ...legacyHistory,
          officerRequest(OFFICER_EMAIL, 3),
        ]),
      );
    });

    test.each([["APPROVAL"], ["DENIAL"], ["REVISION"]])(
      "a supervisor can give the latest request a %s response in their own name",
      async (type) => {
        await seedActionHistory(legacyHistory);
        await assertSucceeds(
          writeActionHistory(getSupervisor(), [
            approvedLegacyRequest,
            withResponse(
              pendingLegacyRequest,
              supervisorResponse(SUPERVISOR_EMAIL, type),
            ),
          ]),
        );
      },
    );

    test("a supervisor can respond when the request is the only entry", async () => {
      await seedActionHistory([pendingLegacyRequest]);
      await assertSucceeds(
        writeActionHistory(getSupervisor(), [
          withResponse(
            pendingLegacyRequest,
            supervisorResponse(SUPERVISOR_EMAIL),
          ),
        ]),
      );
    });

    test("a supervisor can approve and then forward a request", async () => {
      await seedActionHistory(legacyHistory);
      const approved = withResponse(
        pendingLegacyRequest,
        supervisorResponse(SUPERVISOR_EMAIL),
      );
      await assertSucceeds(
        writeActionHistory(getSupervisor(), [approvedLegacyRequest, approved]),
      );
      await assertSucceeds(
        writeActionHistory(getSupervisor(), [
          approvedLegacyRequest,
          approved,
          officerRequest(SUPERVISOR_EMAIL, 3, { type: "APPROVAL" }),
        ]),
      );
    });

    test("an officer can mark the latest request stale, response and all", async () => {
      const answered = withResponse(
        officerRequest(OFFICER_EMAIL, 2),
        supervisorResponse(SUPERVISOR_EMAIL),
      );
      await seedActionHistory([approvedLegacyRequest, answered]);
      await assertSucceeds(
        writeActionHistory(getOfficer(), [
          approvedLegacyRequest,
          { ...answered, isStale: true },
        ]),
      );
    });

    test("an officer can clear the history", async () => {
      await seedActionHistory(legacyHistory);
      await assertSucceeds(
        setDoc(
          doc(getOfficer(), opportunityPath()),
          {
            actionHistory: deleteField(),
            allUniqueReviewerIds: deleteField(),
            currentReviewerId: deleteField(),
            stateCode: "US_TN",
          },
          { merge: true },
        ),
      );
    });

    test("an officer can update other fields on a doc with history", async () => {
      await seedActionHistory(legacyHistory);
      await assertSucceeds(
        setDoc(
          doc(getOfficer(), opportunityPath()),
          { stateCode: "US_TN", submitted: { by: OFFICER_EMAIL } },
          { merge: true },
        ),
      );
    });

    test("an officer can write the history back unchanged", async () => {
      await seedActionHistory(legacyHistory);
      await assertSucceeds(writeActionHistory(getOfficer(), legacyHistory));
    });
  });

  describe.each([[""], ["DEMO_"], ["DEMO2_"]])(
    "forgery attempts in %sclientUpdatesV2",
    (collectionPrefix) => {
      beforeEach(async () => {
        await seedActionHistory(legacyHistory, collectionPrefix);
      });

      const writeAsOfficer = (actionHistory: DocumentData[]) =>
        writeActionHistory(getOfficer(), actionHistory, collectionPrefix);

      test("an officer cannot respond in a supervisor's name", async () => {
        await assertFails(
          writeAsOfficer([
            approvedLegacyRequest,
            withResponse(
              pendingLegacyRequest,
              supervisorResponse(SUPERVISOR_EMAIL),
            ),
          ]),
        );
      });

      test("an officer cannot write a response with no byUid", async () => {
        await assertFails(
          writeAsOfficer([
            approvedLegacyRequest,
            withResponse(pendingLegacyRequest, supervisorResponse(undefined)),
          ]),
        );
      });

      test("an officer cannot change the response on an earlier entry", async () => {
        await assertFails(
          writeAsOfficer([
            withResponse(
              officerRequest(undefined, 1),
              supervisorResponse(undefined, "APPROVAL"),
            ),
            pendingLegacyRequest,
          ]),
        );
      });

      test("an officer cannot add a response to an earlier entry, even in their own name", async () => {
        await seedActionHistory(
          [officerRequest(undefined, 1), pendingLegacyRequest],
          collectionPrefix,
        );
        await assertFails(
          writeAsOfficer([
            withResponse(
              officerRequest(undefined, 1),
              supervisorResponse(OFFICER_EMAIL),
            ),
            pendingLegacyRequest,
          ]),
        );
      });

      test("an officer cannot edit an earlier entry while appending a request", async () => {
        await assertFails(
          writeAsOfficer([
            withResponse(
              officerRequest(undefined, 1),
              supervisorResponse(undefined, "APPROVAL"),
            ),
            pendingLegacyRequest,
            officerRequest(OFFICER_EMAIL, 3),
          ]),
        );
      });

      test("an officer cannot append a request that already has a response", async () => {
        await assertFails(
          writeAsOfficer([
            ...legacyHistory,
            withResponse(
              officerRequest(OFFICER_EMAIL, 3),
              supervisorResponse(OFFICER_EMAIL),
            ),
          ]),
        );
      });

      test("an officer cannot append a request in someone else's name", async () => {
        await assertFails(
          writeAsOfficer([
            ...legacyHistory,
            officerRequest(SUPERVISOR_EMAIL, 3),
          ]),
        );
      });

      test("an officer cannot replace an existing response on the latest entry", async () => {
        await seedActionHistory(
          [
            withResponse(
              officerRequest(OFFICER_EMAIL, 1),
              supervisorResponse(SUPERVISOR_EMAIL, "DENIAL"),
            ),
          ],
          collectionPrefix,
        );
        await assertFails(
          writeAsOfficer([
            withResponse(
              officerRequest(OFFICER_EMAIL, 1),
              supervisorResponse(OFFICER_EMAIL, "APPROVAL"),
            ),
          ]),
        );
      });

      test("an officer cannot remove the response on the latest entry", async () => {
        await seedActionHistory([approvedLegacyRequest], collectionPrefix);
        await assertFails(writeAsOfficer([officerRequest(undefined, 1)]));
      });

      test("an officer cannot revive a stale request", async () => {
        await seedActionHistory(
          [{ ...approvedLegacyRequest, isStale: true }],
          collectionPrefix,
        );
        await assertFails(writeAsOfficer([approvedLegacyRequest]));
      });

      test("an officer cannot change what the latest request asked for", async () => {
        await assertFails(
          writeAsOfficer([
            approvedLegacyRequest,
            { ...pendingLegacyRequest, type: "APPROVAL" },
          ]),
        );
      });

      test("an officer cannot drop earlier entries", async () => {
        await assertFails(writeAsOfficer([pendingLegacyRequest]));
      });
    },
  );
});
