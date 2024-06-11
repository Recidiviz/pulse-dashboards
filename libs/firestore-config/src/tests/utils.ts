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
  setDoc,
  where,
} from "@firebase/firestore";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import fs from "fs";
import path from "path";

import { AssertFn, FirestoreInstance } from "./types";

export function startTestEnv() {
  return initializeTestEnvironment({
    projectId: "demo-test",
    firestore: {
      rules: fs.readFileSync(
        path.join(__dirname, "../firestore.rules"),
        "utf8",
      ),
    },
  });
}

/**
 * ETL collections are read-only
 */
export const ETL_COLLECTION_NAMES = [
  "supervisionStaff",
  "incarcerationStaff",
  "clients",
  "residents",
  "compliantReportingReferrals",
];
/**
 * Update collections are readable and writeable by all staff users within a state
 */
export const SHARED_UPDATE_COLLECTION_NAMES = ["clientUpdatesV2"];
/**
 * User update collections are readable and writable only to the user
 */
export const PERSONAL_UPDATE_COLLECTION_NAME = "userUpdates";

export async function testAllReadsUnrestricted(
  db: FirestoreInstance,
  assertFn: AssertFn,
) {
  return Promise.all([
    ...ETL_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
    ...SHARED_UPDATE_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(getDocs(db.collection(collectionName)));
    }),
  ]);
}

export async function testAllReadsForState(
  db: FirestoreInstance,
  assertFn: AssertFn,
  stateCode: string,
  collectionsPrefix = "",
) {
  return Promise.all([
    ...ETL_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(
        getDocs(
          query(
            collection(db, `${collectionsPrefix}${collectionName}`),
            where("stateCode", "==", stateCode),
          ),
        ),
      );
    }),
    ...SHARED_UPDATE_COLLECTION_NAMES.map(async (collectionName) => {
      await assertFn(
        getDoc(
          doc(
            collection(db, `${collectionsPrefix}${collectionName}`),
            `${stateCode}_12345`,
          ),
        ),
      );
    }),
  ]);
}

export async function testUserUpdateRead(
  db: FirestoreInstance,
  assertFn: AssertFn,
  userEmail: string,
) {
  await assertFn(
    getDoc(doc(collection(db, PERSONAL_UPDATE_COLLECTION_NAME), userEmail)),
  );
}

export function testWriteToCollectionsWithoutStateCodePrefix(
  collectionNames: Array<string>,
  db: FirestoreInstance,
  assertFn: AssertFn,
) {
  return Promise.all(
    collectionNames.map((collectionName) =>
      assertFn(setDoc(doc(db, collectionName, "foo"), {})),
    ),
  );
}

export function testWriteToCollectionsForStateWithStateCodePrefix(
  collectionNames: Array<string>,
  db: FirestoreInstance,
  assertFn: AssertFn,
  stateCode: string,
) {
  return Promise.all(
    collectionNames.map((collectionName) =>
      assertFn(setDoc(doc(db, collectionName, `${stateCode}_someID`), {})),
    ),
  );
}

export async function testWriteToPersonalUpdateCollection(
  db: FirestoreInstance,
  assertFn: AssertFn,
  email: string,
) {
  await assertFn(setDoc(doc(db, PERSONAL_UPDATE_COLLECTION_NAME, email), {}));
}
