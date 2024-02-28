// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

const firebaseAdmin = require("firebase-admin");
const fs = require("fs");
const { fetchOfflineUser } = require("../core");
const { getAppMetadata } = require("../utils/getAppMetadata");
const { isOfflineMode } = require("../utils/isOfflineMode");
const { stateCodes } = require("../constants/stateCodes");
const { respondWithForbidden } = require("../routes/api");

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

function getFirebaseToken(impersonateUser = false) {
  return async function (req, res) {
    let uid;
    let stateCode;
    let recidivizAllowedStates = [];
    const appMetadata = getAppMetadata(req);

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
      const { impersonatedEmail, impersonatedStateCode } = req.query;
      uid = impersonatedEmail;
      stateCode = impersonatedStateCode;
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
    const firebaseToken = await firebaseAdmin.auth().createCustomToken(uid, {
      stateCode,
      recidivizAllowedStates,
      impersonator: impersonateUser,
    });

    res.json({ firebaseToken });
  };
}

module.exports = {
  getFirebaseToken,
};
