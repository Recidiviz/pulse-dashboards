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

import firebaseAdmin from "firebase-admin";

import { stateCodes } from "~auth-utils";

import { fetchOfflineUser } from "../core";
import {
  fetchImpersonatedUserRestrictions,
  respondWithBadRequest,
  respondWithForbidden,
} from "../routes/api";
import { getAppMetadata } from "../utils/getAppMetadata";
import { isOfflineMode } from "../utils/isOfflineMode";
import { readOfflineUserOverrides } from "../utils/offlineUserOverrides";

const { METADATA_NAMESPACE } = process.env;

const projectId = process.env.FIREBASE_PROJECT || "demo-dev";

const appOptions = { projectId };
if (!isOfflineMode()) {
  appOptions.credential = firebaseAdmin.credential.cert(
    JSON.parse(process.env.FIREBASE_CREDENTIAL_JSON),
  );
} else {
  // Without this the admin SDK authenticates against real GCP and every read
  // fails with PERMISSION_DENIED on "demo-dev". Set before initializeApp;
  // respects an existing value so e2e can point at its own `firebase` host.
  process.env.FIRESTORE_EMULATOR_HOST ??= "localhost:8080";
}

// Guard against duplicate initialization: under the vite-node dev runtime a
// module can be evaluated more than once, which would otherwise throw
// "default Firebase app already exists" on the second initializeApp call.
if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp(appOptions);
}

/**
 * Whether these user permissions include the Parole Board route. Firestore
 * rules read the resulting hasParoleBoardAccess claim to gate the
 * paroleBoardClientProfiles collection.
 *
 * @param {{ routes?: Record<string, boolean> } | undefined} userMetadata - The
 *   user's Auth0 app metadata, or the impersonated user's restrictions.
 */
function hasParoleBoardRoute(userMetadata) {
  return userMetadata?.routes?.parole === true;
}

export async function getFirebaseToken(req, res) {
  let uid;
  let stateCode;
  let recidivizAllowedStates = [];
  let hasParoleBoardAccess;
  const appMetadata = getAppMetadata(req);

  const { impersonationParams } = req.query ?? {};
  const impersonateUser = !!impersonationParams;
  if (isOfflineMode()) {
    // Honor the same override the Typesense mint endpoints read. The `uid` below
    // becomes `request.auth.token.user_id`, which Firestore rules compare
    // against the `userUpdates` doc id the frontend asks for — so a token minted
    // for the default user while the app believes it is someone else gets a
    // rules denial, not an empty result.
    const user = fetchOfflineUser(readOfflineUserOverrides(req));
    const offlineAppMetadata = getAppMetadata({ user });
    stateCode = offlineAppMetadata.stateCode;
    uid = user.email;
    recidivizAllowedStates = Object.values(stateCodes);
    hasParoleBoardAccess = hasParoleBoardRoute(offlineAppMetadata);
  } else if (impersonateUser) {
    if (appMetadata.stateCode.toLowerCase() !== "recidiviz") {
      respondWithForbidden(res);
      return;
    }
    try {
      const { impersonatedEmail, impersonatedStateCode } =
        JSON.parse(impersonationParams);
      uid = impersonatedEmail;
      stateCode = impersonatedStateCode;
    } catch (e) {
      respondWithBadRequest(res, [e.message]);
      return;
    }
    // The impersonator's own token carries none of the impersonated user's
    // permissions, so look them up to mint the claim they would get. A failed
    // lookup withholds only the Parole Board claim, so impersonation keeps the
    // rest of its access.
    try {
      hasParoleBoardAccess = hasParoleBoardRoute(
        await fetchImpersonatedUserRestrictions(uid),
      );
    } catch (e) {
      // The error can carry the lookup URL, which names the user by a hash of
      // their email, so only its status is logged.
      console.error(
        `Failed to look up the impersonated user's permissions; minting the token without Parole Board access. Status: [${e?.response?.status}]`,
      );
      hasParoleBoardAccess = false;
    }
  } else {
    uid = req.user[`${METADATA_NAMESPACE}email_address`];
    stateCode = appMetadata.stateCode;
    recidivizAllowedStates = (appMetadata.allowedStates ?? []).map((sc) =>
      sc.toUpperCase(),
    );
    hasParoleBoardAccess = hasParoleBoardRoute(appMetadata);
  }

  if (!uid) {
    throw new Error("Missing user email address");
  }

  if (!stateCode) {
    throw new Error("Missing state code");
  }

  stateCode = stateCode.toUpperCase();
  const app = "staff";
  const environment = process.env.AUTH_ENV;
  const forceWorkflowsDemoData = Boolean(appMetadata?.forceWorkflowsDemoData);

  const firebaseToken = await firebaseAdmin.auth().createCustomToken(uid, {
    app,
    stateCode,
    recidivizAllowedStates,
    impersonator: impersonateUser,
    environment,
    forceWorkflowsDemoData,
    hasParoleBoardAccess,
  });

  res.json({ firebaseToken });
}
