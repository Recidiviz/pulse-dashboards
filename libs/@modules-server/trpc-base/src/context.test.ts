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

import { formatAndVerifyUser } from "./context";
import type { Auth0User } from "./types";

function auth0User(
  appMetadata: Auth0User["https://dashboard.recidiviz.org/app_metadata"],
  email: string | undefined,
): Auth0User {
  return {
    "https://dashboard.recidiviz.org/app_metadata": appMetadata,
    "https://dashboard.recidiviz.org/email_address": email,
  };
}

describe("formatAndVerifyUser", () => {
  // Auth0 sends state codes in lowercase; the staff UserStore uppercases them
  // too.
  it("uppercases the lowercase state code Auth0 sends and fills routes", () => {
    const user = formatAndVerifyUser(
      auth0User(
        {
          stateCode: "recidiviz",
          routes: { workflows: true, insights: false },
        },
        "editor@example.com",
      ),
    );

    expect(user).toEqual({
      email: "editor@example.com",
      isRecidivizUser: true,
      featureVariants: {},
      stateCode: "RECIDIVIZ",
      routes: { workflows: true, insights: false },
    });
  });

  it("defaults routes when the token has no routes claim", () => {
    const user = formatAndVerifyUser(
      auth0User({ stateCode: "us_tn" }, "editor@example.com"),
    );

    expect(user).toEqual({
      email: "editor@example.com",
      isRecidivizUser: false,
      featureVariants: {},
      stateCode: "US_TN",
      routes: {},
    });
  });

  it("returns undefined when the token has no email claim", () => {
    expect(
      formatAndVerifyUser(auth0User({ stateCode: "us_tn" }, undefined)),
    ).toBeUndefined();
  });
});
