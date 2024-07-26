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

const { createHmac } = require("crypto");

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // this should catch people who didn't show up on the roster:
  // Recidiviz users, manually created email+password accounts, etc
  if (!event.user.app_metadata.externalId) {
    // intercom hash for Identity Verification needs to be based on a UUID
    const intercomHash = createHmac("sha256", event.secrets.INTERCOM_SECRET_KEY)
      .update(event.user.user_id)
      .digest("hex");
    api.user.setAppMetadata("intercomUserHash", intercomHash);
  }
};
