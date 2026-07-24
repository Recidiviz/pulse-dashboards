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

const { GoogleAuth } = require("google-auth-library");
const Base64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

/**
 * Helper to check for a users email across common places an SSO-provider
 * might put it
 */
function getUserEmail(event) {
  const { email, emailaddress, emailAddress } = event.user;
  return email ?? emailaddress ?? emailAddress;
}

/**
 * True when the login is for the Idaho TH application. Fails closed: if
 * IDAHO_TH_CLIENT_ID is unset we cannot confirm the app, so we do NOT act
 * (return false). The secret is required in every environment.
 */
function isIdahoThClient(event) {
  const configured = (actions.secrets.IDAHO_TH_CLIENT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (configured.length === 0) return false;
  return configured.includes(event.client?.client_id);
}

/**
 * Query the admin panel at the url stored in the secret RECIDIVIZ_ADMIN_PANEL_URL
 * and return the unwrapped response.
 *
 * Throws if the user does not exist
 *
 * @param userEmail{string}
 */
async function fetchUserRestrictions(userEmail) {
  const credentials = JSON.parse(
    actions.secrets.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  );

  /** Get user restrictions from Admin Panel backend */
  const auth = new GoogleAuth({ credentials });
  const client = await auth.getIdTokenClient(
    actions.secrets.RECIDIVIZ_ADMIN_PANEL_TARGET_AUDIENCE,
  );

  // some ID accounts come up with an onmicrosoft domain. This patches the email for the request
  const request_email = userEmail?.replace(
    "iddoc.onmicrosoft.com",
    "idoc.idaho.gov",
  );

  let userHash = Base64.stringify(SHA256(request_email?.toLowerCase()));
  if (userHash.startsWith("/")) {
    userHash = userHash.replace("/", "_");
  }
  const url = `${actions.secrets.RECIDIVIZ_ADMIN_PANEL_URL}auth/users/${userHash}`;

  const apiResponse = await client.request({ url, retry: true });
  return apiResponse.data;
}

module.exports = {
  fetchUserRestrictions,
  getUserEmail,
  isIdahoThClient,
};
