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

const { Analytics } = require("@segment/analytics-node");

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event) => {
  const segment = new Analytics({
    writeKey: event.secrets.SEGMENT_WRITE_KEY,
    flushAt: 1,
  });
  const { user } = event;

  const properties = {
    isRecidiviz: user.app_metadata.stateCode === "RECIDIVIZ",
    ...user.app_metadata,
  };

  segment.track({
    event: "auth0_login_succeeded",
    userId: user.user_id,
    properties,
  });

  await segment.flush();
};
