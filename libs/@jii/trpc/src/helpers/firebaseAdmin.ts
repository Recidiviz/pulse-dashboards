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

import firebaseAdmin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

import {
  collectionNameFromConfig,
  FirestoreCollectionName,
} from "~firestore-config";

export const firebaseApp = () => {
  const firebaseCredential = process.env["DATA_SOURCE_FIREBASE_CREDENTIAL"];

  if (!firebaseCredential && process.env["IS_OFFLINE"] !== "true") {
    throw new Error("Missing Firebase credential");
  }

  return (
    firebaseAdmin.apps[0] ??
    firebaseAdmin.initializeApp(
      // this should only be missing in offline mode, where it doesn't really matter,
      // thanks to the check above
      firebaseCredential
        ? {
            projectId: process.env["FIREBASE_BACKEND_PROJECT"],
            credential: firebaseAdmin.credential.cert(
              JSON.parse(firebaseCredential),
            ),
          }
        : undefined,
    )
  );
};

const firestore = () => getFirestore(firebaseApp());

export function getFirestoreCollectionQuerier(
  stateCode: string,
  isDemoRequest: boolean,
) {
  return (key: FirestoreCollectionName) => {
    const collectionName = collectionNameFromConfig({
      name: { key },
      demo: isDemoRequest,
    });

    return firestore()
      .collection(collectionName)
      .where("stateCode", "==", stateCode);
  };
}

export type FirestoreCollectionQuerier = ReturnType<
  typeof getFirestoreCollectionQuerier
>;
