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
import { defineString } from "firebase-functions/params";
import toUpper from "lodash/toUpper";
import { z } from "zod";

import { AuthorizedUserProfile, ResidentUserProfile } from "~auth0-jii";

import { secrets } from "./secrets";

// Firestore is running in a different Firebase project than these functions
const dataSourceProject = defineString("DATA_SOURCE_FIREBASE_PROJECT");

// there can only be one firebase app instance, but we have to access the credentials within the function;
// therefore we will cache it here the first time it's accessed
let firebaseApp: App | undefined;

async function getFirebaseApp(): Promise<App> {
  if (firebaseApp) return firebaseApp;

  // this is the service account key we will use to authenticate
  const dataSourceCredential = await secrets.getLatestValue(
    "DATA_SOURCE_FIREBASE_CREDENTIAL",
  );
  // the full credential exceeds the secrets character limit,
  // which is why the private key field is stored separately (it is by far the largest value)
  const dataSourceCredentialPrivateKey = await secrets.getLatestValue(
    "DATA_SOURCE_FIREBASE_CREDENTIAL_PRIVATE_KEY",
  );

  const firebaseCredential = {
    ...JSON.parse(dataSourceCredential),
    // this string may contain newlines, which we need to render as \n codes for valid JSON
    private_key: dataSourceCredentialPrivateKey.replace(/\\n/gm, "\n"),
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
  {
    stateCode,
    externalId,
    allowedStates,
    permissions,
    pseudonymizedId,
  }: AuthorizedUserProfile,
) {
  const allowedStatesNormalized = (allowedStates ?? []).map(toUpper);

  return firebaseAdmin.auth(await getFirebaseApp()).createCustomToken(uid, {
    app: "jii",
    stateCode,
    externalId,
    pseudonymizedId,
    // we do need both of these due to special handling for Recidiviz staff across apps
    recidivizAllowedStates: allowedStatesNormalized,
    allowedStates: allowedStatesNormalized,
    permissions,
  });
}

export async function getFirestore() {
  return firebaseAdmin.firestore(await getFirebaseApp());
}

function getResidentPseudoId(
  residentRecord: firebaseAdmin.firestore.DocumentData,
) {
  // in practice this should always parse, but we can't import the full schema from ~datatypes
  // due to Vite dependency issues. We only care about this field anyway
  const { pseudonymizedId } = z
    .object({ pseudonymizedId: z.string() })
    .parse(residentRecord);

  return pseudonymizedId;
}

export async function checkResidentsRoster(
  stateCode: string,
  userId: string,
): Promise<AuthorizedUserProfile | undefined> {
  const userResidentRecord = (
    await (await getFirestore())
      .doc(`residents/${stateCode.toLowerCase()}_${userId}`)
      .get()
  ).data();

  if (!userResidentRecord) return;

  const pseudonymizedId = getResidentPseudoId(userResidentRecord);

  return {
    stateCode: stateCode,
    externalId: userId,
    pseudonymizedId,
    permissions: ["live_data"],
  };
}

export async function checkDemoResidentsRoster(
  stateCode: string,
  userId: string,
): Promise<ResidentUserProfile | undefined> {
  const userDemoResidentRecord = (
    await (await getFirestore())
      .collection(`DEMO_residents`)
      .where("stateCode", "==", stateCode)
      .where("personExternalId", "==", userId)
      .limit(1)
      .get()
  ).docs[0]?.data();

  if (!userDemoResidentRecord) return;

  const pseudonymizedId = getResidentPseudoId(userDemoResidentRecord);

  return {
    stateCode: stateCode,
    externalId: userId,
    pseudonymizedId,
    permissions: [],
  };
}
