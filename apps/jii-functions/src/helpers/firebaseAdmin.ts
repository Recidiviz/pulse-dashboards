// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { App } from "firebase-admin/app";
import { defineSecret, defineString } from "firebase-functions/params";
import toUpper from "lodash/toUpper";

import { UserAppMetadata } from "~auth0-jii";

// Firestore is running in a different Firebase project than these functions
const dataSourceProject = defineString("DATA_SOURCE_FIREBASE_PROJECT");
// this is the service account key we will use to authenticate
const dataSourceCredential = defineSecret("DATA_SOURCE_FIREBASE_CREDENTIAL");
// the full credential exceeds the secrets character limit,
// which is why the private key field is stored separately (it is by far the largest value)
const dataSourceCredentialPrivateKey = defineSecret(
  "DATA_SOURCE_FIREBASE_CREDENTIAL_PRIVATE_KEY",
);

/**
 * Functions calling helpers need to include these secrets in their configuration
 */
export const firebaseAdminSecrets = [
  dataSourceCredential,
  dataSourceCredentialPrivateKey,
];

// there can only be one firebase app instance, but we have to access the credentials within the function;
// therefore we will cache it here the first time it's accessed
let firebaseApp: App | undefined;

function getFirebaseApp(): App {
  if (firebaseApp) return firebaseApp;

  const firebaseCredential = {
    ...JSON.parse(dataSourceCredential.value()),
    // this string may contain newlines, which we need to render as \n codes for valid JSON
    private_key: dataSourceCredentialPrivateKey.value().replace(/\\n/gm, "\n"),
  };

  // cache the app object so we don't try to reinitialize it later
  firebaseApp = firebaseAdmin.initializeApp({
    projectId: dataSourceProject.value(),
    credential: firebaseAdmin.credential.cert(firebaseCredential),
  });

  return firebaseApp;
}

/**
 * Returns a Firebase auth token for a given user, which can be used to access Firestore
 * from the frontend.
 * @param uid needs to be unique but otherwise not used directly
 * @param metadata user app metadata as defined by the schema
 */
export async function getFirebaseToken(
  uid: string,
  { stateCode, externalId, allowedStates, permissions }: UserAppMetadata,
) {
  return firebaseAdmin.auth(getFirebaseApp()).createCustomToken(uid, {
    app: "jii",
    stateCode,
    externalId,
    recidivizAllowedStates: (allowedStates ?? []).map(toUpper),
    permissions,
  });
}

export function getFirestore() {
  return firebaseAdmin.firestore(getFirebaseApp());
}
