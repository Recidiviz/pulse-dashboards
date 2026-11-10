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

import { APP_METADATA_KEY, USER_ROLE } from "~@idaho-th/trpc/auth/constants";

import { parseAuth0User } from "../parseAuth0User";

describe("parseAuth0User", () => {
  test("Staff Auth0 user is parsed correctly", () => {
    const staffPseudonymizedId = "staff-123";
    const appMetadata = {
      role: USER_ROLE.STAFF,
      pseudonymizedId: staffPseudonymizedId,
      stateCode: "US_ID",
    };

    expect(
      parseAuth0User({
        [APP_METADATA_KEY]: appMetadata,
      }),
    ).toEqual({
      appMetadata,
      providerPseudonymizedId: undefined,
      role: USER_ROLE.STAFF,
      staffPseudonymizedId,
    });
  });

  test("Provider Auth0 user is parsed correctly", () => {
    const providerPseudonymizedId = "provider-123";
    const appMetadata = {
      role: USER_ROLE.PROVIDER,
      pseudonymizedId: providerPseudonymizedId,
      stateCode: "US_ID",
    };

    expect(
      parseAuth0User({
        [APP_METADATA_KEY]: appMetadata,
      }),
    ).toEqual({
      appMetadata,
      providerPseudonymizedId,
      role: USER_ROLE.PROVIDER,
      staffPseudonymizedId: undefined,
    });
  });

  test.each([
    ["metadata is missing", {}],
    [
      "role is missing",
      {
        [APP_METADATA_KEY]: {
          pseudonymizedId: "user-123",
        },
      },
    ],
    [
      "role is invalid",
      {
        [APP_METADATA_KEY]: {
          role: "invalid-role",
          pseudonymizedId: "user-123",
        },
      },
    ],
    [
      "pseudonymized ID is missing",
      {
        [APP_METADATA_KEY]: {
          role: USER_ROLE.STAFF,
        },
      },
    ],
    [
      "pseudonymized ID is empty",
      {
        [APP_METADATA_KEY]: {
          role: USER_ROLE.PROVIDER,
          pseudonymizedId: "",
        },
      },
    ],
  ])("Invalid Auth0 user data is rejected when %s", (_caseName, payload) => {
    expect(parseAuth0User(payload)).toBeUndefined();
  });
});
