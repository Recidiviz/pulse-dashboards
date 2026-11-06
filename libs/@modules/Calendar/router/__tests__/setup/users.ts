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

import type { Auth0User } from "~@modules-server/trpc-base";

function tokenUser(
  email: string,
  appMetadata: Auth0User["https://dashboard.recidiviz.org/app_metadata"],
): Auth0User {
  return {
    "https://dashboard.recidiviz.org/email_address": email,
    "https://dashboard.recidiviz.org/app_metadata": appMetadata,
  };
}

/**
 * The token's state claim. Its type lists only states with a module, but a
 * real token can carry any state, because the Modules context uppercases the
 * claim and casts it without checking. The US_ID fixture casts to this type
 * to stand for a state with no module.
 */
export type StateClaim =
  Auth0User["https://dashboard.recidiviz.org/app_metadata"]["stateCode"];

/**
 * A US_CO user with the publicCalendar route. The email has capitals on
 * purpose.
 */
export const coEditor = tokenUser("CO.Editor@example.com", {
  stateCode: "us_co",
  routes: { publicCalendar: true },
});

/** A US_CO user with no routes. */
export const coViewer = tokenUser("co-viewer@example.com", {
  stateCode: "us_co",
});

/** A US_CO user whose publicCalendar route is set to false. */
export const coRouteFalse = tokenUser("co-route-false@example.com", {
  stateCode: "us_co",
  routes: { publicCalendar: false },
});

/** A US_ID user with the publicCalendar route. */
export const idUser = tokenUser("id-user@example.com", {
  stateCode: "us_id" as StateClaim,
  routes: { publicCalendar: true },
});

/** A Recidiviz user, who may act in any state. */
export const recidivizUser = tokenUser("recidiviz-user@example.com", {
  stateCode: "recidiviz",
});

/** A US_CO token with the route but no email claim. */
export const coNoEmail: Auth0User = {
  "https://dashboard.recidiviz.org/email_address": undefined,
  "https://dashboard.recidiviz.org/app_metadata": {
    stateCode: "us_co",
    routes: { publicCalendar: true },
  },
};
