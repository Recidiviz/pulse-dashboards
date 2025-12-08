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
 * Handler that will be called during the execution of a PreUserRegistration flow.
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  const alg = "RS256";
  const privateKey = createPrivateKey(
    // have to correct the way newlines are stored in secret strings
    event.secrets.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY.replace(
      /\\n/g,
      "\n",
    ),
  );

  const clientDenyMessage =
    "There was a problem registering your account. Please contact feedback@recidiviz.org.";

  const email = event.user.email?.toLowerCase();

  // We can treat everyone in this step as a STATE user.
  // Recidiviz and Orijin users sign in via SSO, which skips this action
  const jwt = await new SignJWT({ userType: "STATE", email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("1m")
    .sign(privateKey);

  const response = await fetch(event.secrets.USER_PROFILE_API_URL, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  if (response.ok) {
    return;
  }

  api.access.deny(
    `Unrecognized user: not found in roster (email: ${email})`,
    clientDenyMessage,
  );
};
