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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "@firebase/firestore";
import {
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import { getEnhancedNDUser } from "../jii-app/utils";
import { FirestoreInstance } from "../types";
import { startTestEnv } from "../utils";
import {
  getCORecidivizUser,
  getDemoOnlyIDPhi,
  getIDCommissioner,
  getIDPhi,
  getIDRecidivizUser,
  getIDUser,
  getStatelessUser,
} from "./utils";

const REPORTS = "paroleBoardReports";
const DEMO_REPORTS = `DEMO_${REPORTS}`;

// Record ids are the residents doc ids: a state prefix and the DOC id.
const ID_RECORD = "us_id_123";
const CO_RECORD = "us_co_123";
const ND_RECORD = "us_nd_123";

const IN_PROGRESS = "in_progress_report";
const SUBMITTED = "submitted_report";
const SECTION = "offenseInformation";

let testEnv: RulesTestEnvironment;

function parentDoc(
  db: FirestoreInstance,
  recordId: string,
  collectionName = REPORTS,
) {
  return doc(db, collectionName, recordId);
}

function reportDoc(
  db: FirestoreInstance,
  recordId: string,
  reportId: string,
  collectionName = REPORTS,
) {
  return doc(db, collectionName, recordId, "reports", reportId);
}

function snapshotDoc(
  db: FirestoreInstance,
  recordId: string,
  reportId: string,
  collectionName = REPORTS,
) {
  return doc(
    db,
    collectionName,
    recordId,
    "reports",
    reportId,
    "snapshot",
    SECTION,
  );
}

// The PHI test users' uid, and another PHI's, who created the seeded reports.
const PHI_UID = "phi@us_id.gov";
const OTHER_PHI_UID = "other.phi@us_id.gov";
const SEEDED_AT = Timestamp.fromDate(new Date("2026-01-01"));

// The attribution every report write carries.
const STAMP = { updatedBy: PHI_UID, updatedAt: serverTimestamp() };

// An edit that leaves a report in progress.
const FIELD_EDIT = {
  "sections.offenseInformation.fields.victim": { value: "YES" },
  ...STAMP,
};

/** Builds a report in progress as the app creates it, with overrides. */
function newReport(overrides: Record<string, unknown> = {}) {
  return {
    stateCode: "US_ID",
    status: "IN_PROGRESS",
    createdBy: PHI_UID,
    createdAt: serverTimestamp(),
    ...STAMP,
    ...overrides,
  } as Record<string, unknown>;
}

/**
 * Builds the batch the app commits on submission: the report's new status, a
 * section snapshot, and the snapshot manifest.
 *
 * @param withManifest - Whether to include the manifest. Leave it out to build
 *   a submission the rules must reject.
 */
function submissionBatch(
  db: FirestoreInstance,
  reportId: string,
  { withManifest = true, collectionName = REPORTS } = {},
) {
  const batch = writeBatch(db);
  const snapshotsPath = [ID_RECORD, "reports", reportId, "snapshot"] as const;
  batch.update(reportDoc(db, ID_RECORD, reportId, collectionName), {
    status: "SUBMITTED",
    ...STAMP,
  });
  batch.set(doc(db, collectionName, ...snapshotsPath, "summary"), {
    stateCode: "US_ID",
  });
  if (withManifest) {
    batch.set(doc(db, collectionName, ...snapshotsPath, "manifest"), {
      stateCode: "US_ID",
      sectionKeys: ["summary"],
    });
  }
  return batch;
}

/**
 * Seeds a resident with a parent doc, a report in progress, and a submitted
 * report. Both reports get a snapshot, although the app writes one only on
 * submission, so the read rules for an in-progress report's snapshot are tested
 * too.
 */
async function seedRecord(
  collectionName: string,
  recordId: string,
  stateCode: string,
) {
  const attribution = {
    createdBy: OTHER_PHI_UID,
    createdAt: SEEDED_AT,
    updatedBy: OTHER_PHI_UID,
    updatedAt: SEEDED_AT,
  };
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(parentDoc(db, recordId, collectionName), {
      stateCode,
      activeReportId: IN_PROGRESS,
    });
    await setDoc(reportDoc(db, recordId, IN_PROGRESS, collectionName), {
      stateCode,
      status: "IN_PROGRESS",
      ...attribution,
    });
    await setDoc(reportDoc(db, recordId, SUBMITTED, collectionName), {
      stateCode,
      status: "SUBMITTED",
      ...attribution,
    });
    await setDoc(snapshotDoc(db, recordId, IN_PROGRESS, collectionName), {
      stateCode,
    });
    await setDoc(snapshotDoc(db, recordId, SUBMITTED, collectionName), {
      stateCode,
    });
  });
}

beforeAll(async () => {
  testEnv = await startTestEnv("staff-app-parole-board-reports");
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  // US_ID is the users' own state and US_CO another state. US_ND is seeded
  // only for the enhanced JII user, whose helper is ND-only.
  await Promise.all([
    seedRecord(REPORTS, ID_RECORD, "US_ID"),
    seedRecord(REPORTS, CO_RECORD, "US_CO"),
    seedRecord(REPORTS, ND_RECORD, "US_ND"),
    seedRecord(DEMO_REPORTS, ID_RECORD, "US_ID"),
    seedRecord(DEMO_REPORTS, CO_RECORD, "US_CO"),
  ]);
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe("paroleBoardReports parent doc", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("PHI can read and update the parent doc in their state", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertSucceeds(getDoc(parentDoc(db, ID_RECORD)));
    await assertSucceeds(
      updateDoc(parentDoc(db, ID_RECORD), { activeReportId: null }),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI can create the parent doc for a resident who has none", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertSucceeds(getDoc(parentDoc(db, "us_id_456")));
    await assertSucceeds(
      setDoc(parentDoc(db, "us_id_456"), {
        stateCode: "US_ID",
        activeReportId: "new_report",
      }),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot read or write the parent doc in another state", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(getDoc(parentDoc(db, CO_RECORD)));
    await assertFails(
      updateDoc(parentDoc(db, CO_RECORD), { activeReportId: null }),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot delete the parent doc", async () => {
    await assertFails(
      deleteDoc(parentDoc(getIDPhi(testEnv).firestore(), ID_RECORD)),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot read or write the parent doc, which shows whether a report is in progress", async () => {
    const db = getIDCommissioner(testEnv).firestore();
    await assertFails(getDoc(parentDoc(db, ID_RECORD)));
    await assertFails(
      updateDoc(parentDoc(db, ID_RECORD), { activeReportId: null }),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("staff user without Parole Board access cannot read the parent doc, even though the general read rule allows other staff collections", async () => {
    const db = getIDUser(testEnv).firestore();
    await assertFails(getDoc(parentDoc(db, ID_RECORD)));
    await assertFails(getDoc(parentDoc(db, "us_id_does_not_exist")));
  });

  // eslint-disable-next-line vitest/expect-expect
  test("stateless user cannot read the parent doc", async () => {
    await assertFails(
      getDoc(parentDoc(getStatelessUser(testEnv).firestore(), ID_RECORD)),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can read but not write the parent doc in a state in recidivizAllowedStates", async () => {
    const db = getIDRecidivizUser(testEnv).firestore();
    await assertSucceeds(getDoc(parentDoc(db, ID_RECORD)));
    await assertFails(
      updateDoc(parentDoc(db, ID_RECORD), { activeReportId: null }),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user cannot read the parent doc in a state outside recidivizAllowedStates", async () => {
    await assertFails(
      getDoc(parentDoc(getCORecidivizUser(testEnv).firestore(), ID_RECORD)),
    );
  });
});

describe("paroleBoardReports reports", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("PHI can create, read, and update a report in progress", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertSucceeds(
      setDoc(reportDoc(db, ID_RECORD, "new_report"), newReport()),
    );
    await assertSucceeds(getDoc(reportDoc(db, ID_RECORD, IN_PROGRESS)));
    await assertSucceeds(
      updateDoc(reportDoc(db, ID_RECORD, IN_PROGRESS), FIELD_EDIT),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    ["createdBy", { createdBy: OTHER_PHI_UID }],
    ["updatedBy", { updatedBy: OTHER_PHI_UID }],
    ["createdAt", { createdAt: SEEDED_AT }],
    ["updatedAt", { updatedAt: SEEDED_AT }],
  ])(
    "PHI cannot create a report whose %s is not their own uid or the request time",
    async (_field, overrides) => {
      await assertFails(
        setDoc(
          reportDoc(getIDPhi(testEnv).firestore(), ID_RECORD, "new_report"),
          newReport(overrides),
        ),
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test.each([
    // The report keeps the updatedBy of the PHI who seeded it.
    [
      "without stamping it",
      { "sections.offenseInformation.fields.victim": { value: "YES" } },
    ],
    ["under another user's uid", { ...FIELD_EDIT, updatedBy: OTHER_PHI_UID }],
    ["with a backdated updatedAt", { ...FIELD_EDIT, updatedAt: SEEDED_AT }],
    ["changing createdBy", { ...FIELD_EDIT, createdBy: PHI_UID }],
    ["changing createdAt", { ...FIELD_EDIT, createdAt: serverTimestamp() }],
  ])("PHI cannot edit a report %s", async (_label, edit) => {
    await assertFails(
      updateDoc(
        reportDoc(getIDPhi(testEnv).firestore(), ID_RECORD, IN_PROGRESS),
        edit,
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI can submit a report in progress in a batch that creates its snapshot manifest", async () => {
    await assertSucceeds(
      submissionBatch(getIDPhi(testEnv).firestore(), IN_PROGRESS).commit(),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot submit a report without creating its snapshot manifest, so a submitted report always has a snapshot", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(
      updateDoc(reportDoc(db, ID_RECORD, IN_PROGRESS), {
        status: "SUBMITTED",
        ...STAMP,
      }),
    );
    await assertFails(
      submissionBatch(db, IN_PROGRESS, { withManifest: false }).commit(),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each([["SUBMITTED"], ["ARCHIVED"], [undefined]])(
    "PHI cannot create a report whose status is %s, only one in progress",
    async (status) => {
      const report = newReport({ status });
      if (status === undefined) delete report["status"];
      await assertFails(
        setDoc(
          reportDoc(getIDPhi(testEnv).firestore(), ID_RECORD, "new_report"),
          report,
        ),
      );
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot archive a report", async () => {
    await assertFails(
      updateDoc(
        reportDoc(getIDPhi(testEnv).firestore(), ID_RECORD, IN_PROGRESS),
        { status: "ARCHIVED", ...STAMP },
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot edit or reopen a submitted report", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(
      updateDoc(reportDoc(db, ID_RECORD, SUBMITTED), FIELD_EDIT),
    );
    await assertFails(
      updateDoc(reportDoc(db, ID_RECORD, SUBMITTED), {
        status: "IN_PROGRESS",
        ...STAMP,
      }),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot delete a report", async () => {
    await assertFails(
      deleteDoc(
        reportDoc(getIDPhi(testEnv).firestore(), ID_RECORD, IN_PROGRESS),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot read or write a report in another state", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(getDoc(reportDoc(db, CO_RECORD, IN_PROGRESS)));
    await assertFails(
      updateDoc(reportDoc(db, CO_RECORD, IN_PROGRESS), FIELD_EDIT),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI impersonated in production cannot write a report", async () => {
    await assertFails(
      updateDoc(
        reportDoc(
          getIDPhi(testEnv, "production").firestore(),
          ID_RECORD,
          IN_PROGRESS,
        ),
        FIELD_EDIT,
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI impersonated in staging can write a report", async () => {
    await assertSucceeds(
      updateDoc(
        reportDoc(
          getIDPhi(testEnv, "staging").firestore(),
          ID_RECORD,
          IN_PROGRESS,
        ),
        FIELD_EDIT,
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot read a report in progress", async () => {
    const db = getIDCommissioner(testEnv).firestore();
    await assertFails(getDoc(reportDoc(db, ID_RECORD, IN_PROGRESS)));
    await assertFails(
      getDocs(
        query(
          collection(db, REPORTS, ID_RECORD, "reports"),
          where("status", "==", "IN_PROGRESS"),
        ),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner can read a submitted report, by id or with a query filtered on status", async () => {
    const db = getIDCommissioner(testEnv).firestore();
    await assertSucceeds(getDoc(reportDoc(db, ID_RECORD, SUBMITTED)));
    await assertSucceeds(
      getDocs(
        query(
          collection(db, REPORTS, ID_RECORD, "reports"),
          where("status", "in", ["SUBMITTED", "ARCHIVED"]),
        ),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot list reports without filtering on status", async () => {
    await assertFails(
      getDocs(
        collection(
          getIDCommissioner(testEnv).firestore(),
          REPORTS,
          ID_RECORD,
          "reports",
        ),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot read a submitted report in another state", async () => {
    await assertFails(
      getDoc(
        reportDoc(getIDCommissioner(testEnv).firestore(), CO_RECORD, SUBMITTED),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot read a missing report, so a denial does not reveal whether one exists", async () => {
    await assertFails(
      getDoc(
        reportDoc(
          getIDCommissioner(testEnv).firestore(),
          ID_RECORD,
          "does_not_exist",
        ),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot write a report", async () => {
    const db = getIDCommissioner(testEnv).firestore();
    await assertFails(
      updateDoc(reportDoc(db, ID_RECORD, IN_PROGRESS), FIELD_EDIT),
    );
    await assertFails(
      setDoc(reportDoc(db, ID_RECORD, "new_report"), newReport()),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("staff user without Parole Board access cannot read a submitted report", async () => {
    await assertFails(
      getDoc(reportDoc(getIDUser(testEnv).firestore(), ID_RECORD, SUBMITTED)),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can read a report in progress in a state in recidivizAllowedStates, but not write it", async () => {
    const db = getIDRecidivizUser(testEnv).firestore();
    await assertSucceeds(getDoc(reportDoc(db, ID_RECORD, IN_PROGRESS)));
    await assertFails(
      updateDoc(reportDoc(db, ID_RECORD, IN_PROGRESS), FIELD_EDIT),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("enhanced JII user cannot read a report in their own state", async () => {
    await assertFails(
      getDoc(
        reportDoc(
          getEnhancedNDUser(testEnv).firestore(),
          ND_RECORD,
          IN_PROGRESS,
        ),
      ),
    );
  });
});

describe("paroleBoardReports snapshots", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("PHI can create snapshots in the batch that submits their report", async () => {
    await assertSucceeds(
      submissionBatch(getIDPhi(testEnv).firestore(), IN_PROGRESS).commit(),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot create a snapshot without submitting its report", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(
      setDoc(
        doc(
          db,
          REPORTS,
          ID_RECORD,
          "reports",
          IN_PROGRESS,
          "snapshot",
          "summary",
        ),
        { stateCode: "US_ID" },
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot create a snapshot under a report that is already submitted", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(
      setDoc(
        doc(
          db,
          REPORTS,
          ID_RECORD,
          "reports",
          SUBMITTED,
          "snapshot",
          "summary",
        ),
        { stateCode: "US_ID" },
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("PHI cannot edit or delete a snapshot", async () => {
    const db = getIDPhi(testEnv).firestore();
    await assertFails(
      setDoc(snapshotDoc(db, ID_RECORD, SUBMITTED), { stateCode: "US_CO" }),
    );
    await assertFails(deleteDoc(snapshotDoc(db, ID_RECORD, SUBMITTED)));
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner can read a submitted report's snapshot but not one under a report in progress", async () => {
    const db = getIDCommissioner(testEnv).firestore();
    await assertSucceeds(getDoc(snapshotDoc(db, ID_RECORD, SUBMITTED)));
    await assertFails(getDoc(snapshotDoc(db, ID_RECORD, IN_PROGRESS)));
  });

  // eslint-disable-next-line vitest/expect-expect
  test("staff user without Parole Board access cannot read a submitted report's snapshot", async () => {
    await assertFails(
      getDoc(snapshotDoc(getIDUser(testEnv).firestore(), ID_RECORD, SUBMITTED)),
    );
  });
});

describe("DEMO_paroleBoardReports", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("demo-only PHI can read and write demo reports in their state", async () => {
    const db = getDemoOnlyIDPhi(testEnv).firestore();
    await assertSucceeds(getDoc(parentDoc(db, ID_RECORD, DEMO_REPORTS)));
    await assertSucceeds(
      updateDoc(
        reportDoc(db, ID_RECORD, IN_PROGRESS, DEMO_REPORTS),
        FIELD_EDIT,
      ),
    );
    await assertSucceeds(
      submissionBatch(db, IN_PROGRESS, {
        collectionName: DEMO_REPORTS,
      }).commit(),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("demo-only PHI cannot read or write real reports", async () => {
    const db = getDemoOnlyIDPhi(testEnv).firestore();
    await assertFails(getDoc(parentDoc(db, ID_RECORD)));
    await assertFails(
      updateDoc(reportDoc(db, ID_RECORD, IN_PROGRESS), FIELD_EDIT),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("commissioner cannot read a demo report in progress", async () => {
    await assertFails(
      getDoc(
        reportDoc(
          getIDCommissioner(testEnv).firestore(),
          ID_RECORD,
          IN_PROGRESS,
          DEMO_REPORTS,
        ),
      ),
    );
  });

  // eslint-disable-next-line vitest/expect-expect
  test("Recidiviz user can read demo reports outside recidivizAllowedStates", async () => {
    await assertSucceeds(
      getDoc(
        reportDoc(
          getCORecidivizUser(testEnv).firestore(),
          ID_RECORD,
          IN_PROGRESS,
          DEMO_REPORTS,
        ),
      ),
    );
  });
});
