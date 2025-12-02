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
  const emailAddress = event.user.email?.toLowerCase();

  if (
    event.user.app_metatata?.doNotSyncProfile ||
    emailAddress?.endsWith("@recidiviz-test.org")
  ) {
    // Do not sync profile for test users or users flagged manually
    return;
  }

  const alg = "RS256";
  const privateKey = createPrivateKey(
    // have to correct the way newlines are stored in secret strings
    event.secrets.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY.replace(
      /\\n/g,
      "\n",
    ),
  );

  let userType;
  let stateCode;
  let userId;
  let email;

  if (emailAddress?.endsWith("@recidiviz.org")) {
    userType = "RECIDIVIZ";
    email = emailAddress;
  } else if (
    // these are internal Orijin staff
    emailAddress?.endsWith("@orijin.works") ||
    // these are Orijin users, but may be staff in testing/impersonation scenarios
    emailAddress?.endsWith("@learner.orijin.works")
  ) {
    // This metadata comes from the Orijin SAML mappings. To view this configuration
    // you must go to the Auth0 dashboard and select:
    // Auth0 -> Authentication -> Enterprise -> SAML -> connection -> Mappings
    userType = "ORIJIN";
    stateCode = event.user.state_code;
    userId = event.user.external_id;
    // Orijin users do not have access to the emails associated with their accounts
    // skip email verification
    if (!event.user.app_metadata.skipEmailVerification) {
      api.user.setAppMetadata("skipEmailVerification", true);
    }
  } else {
    // is a state-user. Just pass their email
    userType = "STATE";
    email = emailAddress;
  }

  // magic account for testing the unknown user login flow
  if (emailAddress === event.secrets.MA_UNKNOWN_USER_TEST_EMAIL) {
    stateCode = "US_MA";
    userType = "ORIJIN";
    userId = "invalid-id-that-does-not-exist";
  }

  const jwt = await new SignJWT({ userType, stateCode, userId, email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("1m")
    .sign(privateKey);
  const response = await fetch(event.secrets.USER_PROFILE_API_URL, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (response.ok) {
    for (const [k, v] of Object.entries((await response.json()).userProfile)) {
      api.user.setAppMetadata(k, v);
    }
  } else {
    // the (state code: US_XX) part is important, the application may look for that string
    // to determine which state the user in question arrived from when handling this error
    api.access.deny(
      `Unrecognized user: not found in roster (state code: ${stateCode})`,
    );
  }
};
