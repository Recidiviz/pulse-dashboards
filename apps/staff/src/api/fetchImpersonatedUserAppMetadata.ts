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

import { UserAppMetadata } from "../RootStore/types";

// Fetch dashboard user restrictions used for building the mocked auth0 user
export async function fetchImpersonatedUserAppMetadata(
  impersonatedEmail: string,
  auth0Token: string,
): Promise<UserAppMetadata> {
  const response = await fetch(
    `${
      import.meta.env.VITE_API_URL
    }/api/impersonateAuth0User?${new URLSearchParams({
      impersonatedEmail,
    })}`,
    {
      headers: {
        Authorization: `Bearer ${auth0Token}`,
      },
    },
  );
  if (!response.ok) {
    throw Error(
      `There was a problem fetching user app metdata for the user: ${impersonatedEmail}`,
    );
  }
  const userAppMetadata = await response.json();
  return userAppMetadata;
}
