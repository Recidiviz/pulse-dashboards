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

/**
 * Returns an artificial Auth0 id token for a fake/demo user.
 * You can pass in other attributes to override the defaults.
 */
function fetchOfflineUser({
  allowedStates,
  email = "notarealemail@recidiviz.org",
  name = "Demo Jones",
  stateCode = "recidiviz",
  allowedSupervisionLocationIds,
  allowedSupervisionLocationLevel,
}) {
  return {
    picture:
      "https://ui-avatars.com/api/?name=Demo+Jones&background=0D8ABC&color=fff&rounded=false",
    name,
    given_name: "Demo",
    family_name: "Jones",
    email,
    [`${process.env.METADATA_NAMESPACE}app_metadata`]: {
      role: "leadership_role",
      externalId: "agonzalez123",
      pseudonymizedId: "hashed-agonzalez123",
      stateCode,
      allowedSupervisionLocationIds,
      allowedSupervisionLocationLevel,
      allowedStates,
      routes: {
        // Note: routes are only checked if the offline user's state code is updated to a real
        // state (not "recidiviz"). The routes commented out here are provided to make it easier
        // to toggle them on and off when testing.
        // system_prison: true,
        // system_supervision: true,
        // operations: true,
        // system_supervisionToLiberty: true,
        // system_supervisionToPrison: true,
        // insights: true,
        // "insights_supervision_supervisors-list": true,
        // workflowsFacilities: true,
        // workflowsSupervision: true,
      },
      featureVariants: {
        // By setting the active date to the far future, we effectively disable these feature variants
        usMoOverdueRHPilot: { activeDate: "9999" },
        usTnExpirationSubmitToTomis: { activeDate: "9999" },
      },
    },
  };
}

module.exports = { fetchOfflineUser };
