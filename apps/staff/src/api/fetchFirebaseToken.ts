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

export async function fetchFirebaseToken(
  auth0Token: string,
  impersonationParams?: {
    impersonatedEmail: string;
    impersonatedStateCode: string;
  },
): Promise<string> {
  const queryParams = impersonationParams
    ? `?${new URLSearchParams({
        impersonationParams: JSON.stringify(impersonationParams),
      })}`
    : "";
  const url = `${import.meta.env.VITE_API_URL}/token${queryParams}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth0Token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Fetching ${impersonationParams ? "impersonated " : ""}Firebase token failed.\nStatus: ${response.status} - ${response.statusText}`,
    );
  }
  const { firebaseToken } = await response.json();
  return firebaseToken;
}
