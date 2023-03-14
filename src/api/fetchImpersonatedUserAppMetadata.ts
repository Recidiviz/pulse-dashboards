// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { RawUserAppMetadata } from "../RootStore/types";
import UserStore from "../RootStore/UserStore";

// Fetch dashboard user restrictions used for building the mocked auth0 user
export async function fetchImpersonatedUserAppMetadata(
  impersonatedEmail: string,
  impersonatedStateCode: string,
  getTokenSilently?: UserStore["getTokenSilently"]
): Promise<RawUserAppMetadata> {
  if (!getTokenSilently) {
    throw new Error(
      "Missing required auth0 authentication to request Firebase token for impersonation."
    );
  }
  const token = await getTokenSilently();

  const response = await fetch(
    `${
      process.env.REACT_APP_API_URL
    }/api/impersonateAuth0User?${new URLSearchParams({
      impersonatedEmail,
      impersonatedStateCode,
    })}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    throw Error(
      `There was a problem fetching user app metdata for the user: ${impersonatedEmail} and state ${impersonatedStateCode}`
    );
  }
  const userAppMetadata = await response.json();
  return userAppMetadata;
}
