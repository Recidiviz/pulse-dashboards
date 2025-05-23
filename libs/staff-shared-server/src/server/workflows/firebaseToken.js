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
import fs from "fs";

import { stateCodes } from "../constants/stateCodes";
import { fetchOfflineUser } from "../core";
import { respondWithBadRequest, respondWithForbidden } from "../routes/api";
import { getAppMetadata } from "../utils/getAppMetadata";
import { isOfflineMode } from "../utils/isOfflineMode";

const { METADATA_NAMESPACE } = process.env;

const projectId = process.env.FIREBASE_PROJECT || "demo-dev";
const credentialFile = process.env.FIREBASE_CREDENTIAL;

const appOptions = { projectId };
if (!isOfflineMode() && credentialFile) {
  appOptions.credential = firebaseAdmin.credential.cert(
    JSON.parse(fs.readFileSync(credentialFile).toString()),
  );
}

firebaseAdmin.initializeApp(appOptions);

export async function getFirebaseToken(req, res) {
  let uid;
  let stateCode;
  let recidivizAllowedStates = [];
  const appMetadata = getAppMetadata(req);

  const { impersonationParams } = req.query ?? {};
  const impersonateUser = !!impersonationParams;
  if (isOfflineMode()) {
    const user = fetchOfflineUser({});
    stateCode = getAppMetadata({ user }).stateCode;
    uid = user.email;
    recidivizAllowedStates = Object.values(stateCodes);
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
  } else {
    uid = req.user[`${METADATA_NAMESPACE}email_address`];
    stateCode = appMetadata.stateCode;
    recidivizAllowedStates = (appMetadata.allowedStates ?? []).map((sc) =>
      sc.toUpperCase(),
    );
  }

  if (!uid) {
    throw new Error("Missing user email address");
  }

  if (!stateCode) {
    throw new Error("Missing state code");
  }

  stateCode = stateCode.toUpperCase();
  const app = "staff";
  const firebaseToken = await firebaseAdmin.auth().createCustomToken(uid, {
    app,
    stateCode,
    recidivizAllowedStates,
    impersonator: impersonateUser,
  });

  res.json({ firebaseToken });
}
