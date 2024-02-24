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

import UserStore from "../RootStore/UserStore";

export async function fetchImpersonatedFirebaseToken(
  impersonatedEmail: string,
  impersonatedStateCode: string,
  getTokenSilently?: UserStore["getTokenSilently"]
): Promise<string> {
  if (!getTokenSilently) {
    throw new Error(
      "Missing required auth0 authentication to request Firebase token for impersonation."
    );
  }
  const token = await getTokenSilently();
  const url = `${
    process.env.REACT_APP_API_URL
  }/api/impersonateToken?${new URLSearchParams({
    impersonatedEmail,
    impersonatedStateCode,
  })}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Fetching impersonated Firebase token failed.\nStatus: ${response.status} - ${response.statusText}`
    );
  }
  const { firebaseToken } = await response.json();
  return firebaseToken;
}

export async function fetchFirebaseToken(token: string): Promise<string> {
  const url = `${process.env.REACT_APP_API_URL}/token`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Fetching Firebase token failed.\nStatus: ${response.status} - ${response.statusText}`
    );
  }
  const { firebaseToken } = await response.json();
  return firebaseToken;
}
