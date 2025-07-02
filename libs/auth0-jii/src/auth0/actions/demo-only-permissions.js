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

const EDOVO_STATES = ["US_ID", "US_ME"];
const ORIJIN_STATES = ["US_MA", "US_UT"];

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // this ID should match demo app in auth0 configs/Applications
  if (event.client.client_id === "fwgl9sl9sSyrPR8pda6ghv8dGJKGpsDC") {
    // these permissions apply to the demo application only, where all the data is fake

    const email = event.user.email?.toLowerCase();

    // Automatically grant relevant state permissions to reps of tablet providers

    if (
      // anyone with this email domain should be staff
      email?.endsWith("@orijin.works")
    ) {
      api.user.setAppMetadata("stateCode", "ORIJIN");
      api.user.setAppMetadata("allowedStates", ORIJIN_STATES);
      api.user.setAppMetadata("permissions", ["enhanced"]);
    }

    if (email?.endsWith("@edovo.org")) {
      api.user.setAppMetadata("stateCode", "EDOVO");
      api.user.setAppMetadata("allowedStates", EDOVO_STATES);
      api.user.setAppMetadata("permissions", ["enhanced"]);
    }
  }
};
