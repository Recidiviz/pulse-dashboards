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
import { toUpper } from "lodash-es";

import { AuthorizedUserProfile } from "~@jii/auth";

const firebaseCredential = process.env["DATA_SOURCE_FIREBASE_CREDENTIAL"];

if (!firebaseCredential && process.env["IS_OFFLINE"] !== "true") {
  throw new Error("Missing Firebase credential");
}

const firebaseApp = firebaseAdmin.initializeApp(
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
);

/**
 * Returns a Firebase auth token for a given user, which can be used to access Firestore
 * from the frontend.
 * @param uid needs to be unique but otherwise not used directly
 * @param metadata user app metadata as defined by the schema
 */
export async function getFirebaseToken(
  uid: string,
  {
    stateCode,
    externalId,
    allowedStates,
    permissions,
    pseudonymizedId,
  }: AuthorizedUserProfile,
) {
  const allowedStatesNormalized = (allowedStates ?? []).map(toUpper);

  return firebaseAdmin.auth(firebaseApp).createCustomToken(uid, {
    app: "jii",
    stateCode,
    externalId,
    pseudonymizedId,
    // "allowedStates" and "recidivizAllowedStates" are functionally identical in this app;
    // we mostly use allowedStates, as it is more generic, but there is some shared functionality
    // with the staff app in our Firestore Rules that expects recidivizAllowedStates to exist,
    // so for safety we always include it in the token
    allowedStates: allowedStatesNormalized,
    recidivizAllowedStates: allowedStatesNormalized,
    permissions,
  });
}
