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

const { SignJWT } = require("jose");
const { createPrivateKey } = require("crypto");

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const alg = "RS256";
  const privateKey = createPrivateKey(
    // have to correct the way newlines are stored in secret strings
    event.secrets.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY.replace(
      /\\n/g,
      "\n",
    ),
  );

  let stateCode;
  let userId;

  const { email } = event.user;
  if (email?.toLowerCase().endsWith("@recidiviz.org")) {
    stateCode = "RECIDIVIZ";
    userId = email;
  } else {
    // as state-specific connections are enabled they should be added here,
    // to set the appropriate state code and ID for the user logging in
    const connectionToStateCode = {
      // these are not secret so much as they just vary by environment
      // e.g. event.secrets.US_MA_CONNECTION_ID. replace as needed
      ["US_MA_connection_id_TKTK"]: "US_MA",
    };
    stateCode = connectionToStateCode[event.connection.id];
    // expect userId retrieval to vary by state? it should be in the profile somewhere
  }

  if (stateCode && userId) {
    const jwt = await new SignJWT({ stateCode, userId })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(privateKey);
    const response = await fetch(
      "https://authorizeduserprofile-6pktp5icna-uc.a.run.app",
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    if (response.ok) {
      for (const [k, v] of Object.entries(
        (await response.json()).userProfile,
      )) {
        api.user.setAppMetadata(k, v);
      }
    } else {
      api.access.deny("There was a problem authorizing your account.");
    }
  }
  // there are use cases for users who don't pass through this flow
  // (e.g. users manually provisioned in the Auth0 console) which is why
  // it's not a failure if we don't do a lookup at all, only if the lookup fails
};
