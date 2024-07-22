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

const { createHash } = require("crypto");
const { csvParse } = require("d3-dsv");

// NOTE the normalized header row; please exclude headers when you paste in new data
// and make sure the columns line up. (For the initial pilot trusted-tester launch,
// we are being sent a roster CSV upon request by our contact at MDOC, derived from a document
// that he maintains. The structure seen here is based on the initial file he provided.)
const ROSTER_CSV = `name,externalId,username
<<REPLACE ME>>`;

const ROSTER = csvParse(ROSTER_CSV);

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const connection = event.connection.id;

  if (connection === event.secrets.MVCF_CONNECTION_ID) {
    api.user.setAppMetadata("stateCode", "US_ME");

    const usernameFromAD = event.user.sAMAccountName;

    if (!usernameFromAD) return;

    const rosterMatch = ROSTER.find((row) => {
      return (
        (row.username ?? "").toLowerCase() === usernameFromAD.toLowerCase()
      );
    });

    if (rosterMatch) {
      api.user.setAppMetadata("externalId", rosterMatch.externalId);
      // this will be used temporarily to generate pseudonymized IDs.
      // the hash output MUST match the corresponding implementation for the resident record in BQ.
      // this hash logic should be removed once the auth backend supports this tenant
      const pseudoId = createHash("sha256")
        .update(
          `US_ME${rosterMatch.externalId}${event.secrets.RESIDENT_RECORD_SALT}`,
        )
        .digest("base64url")
        .substring(0, 16);
      api.user.setAppMetadata("pseudonymizedId", pseudoId);
    }
  }
};
