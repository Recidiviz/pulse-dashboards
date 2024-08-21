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

import { User } from "@auth0/auth0-spa-js";
import qs from "qs";

import { isOfflineMode } from "~client-env-utils";

type OfflineUserOptions = {
  email?: string;
  name?: string;
  stateCode?: string;
  allowedSupervisionLocationIds?: string[];
  allowedSupervisionLocationLevel?: string;
  allowedStates?: string[];
};

export async function fetchOfflineUser(
  options: OfflineUserOptions,
): Promise<User> {
  if (!isOfflineMode()) {
    throw new Error(`fetchOfflineUser can only be used in offline mode!`);
  }
  const queryParams = qs.stringify(options, { addQueryPrefix: true });
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/offlineUser${queryParams}`,
  );
  return response.json();
}
