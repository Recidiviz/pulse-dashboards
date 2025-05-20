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

  let { email } = event.user;
  email = email?.toLowerCase();
  if (email?.endsWith("@recidiviz.org")) {
    stateCode = "RECIDIVIZ";
    userId = email;
  } else if (
    email?.endsWith("@orijin.works") ||
    email?.endsWith("@learner.orijin.works")
  ) {
    // This metadata comes from the Orijin SAML mappings. To view this configuration
    // you must go to the Auth0 dashboard and select:
    // Auth0 -> Authentication -> Enterprise -> SAML -> connection -> Mappings
    stateCode = event.user.state_code;
    userId = event.user.external_id;
    // Orijin users do not have access to the emails associated with their accounts
    // skip email verification
    if (!event.user.app_metadata.skipEmailVerification) {
      api.user.setAppMetadata("skipEmailVerification", true);
    }
  }

  if (stateCode && userId) {
    const jwt = await new SignJWT({ stateCode, userId })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(privateKey);
    const response = await fetch(event.secrets.USER_PROFILE_API_URL, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
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
