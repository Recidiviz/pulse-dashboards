// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { AuthClient } from "~auth";
import { AuthorizedUserProfile } from "~auth0-jii";
import { Hydratable } from "~hydration-utils";

export type AuthorizedUserProperties = {
  userProfile: AuthorizedUserProfile & { name?: string };
};

export interface AuthHandler
  extends Hydratable,
    Partial<AuthorizedUserProperties> {
  authClient?: AuthClient;
  getFirebaseToken: () => Promise<string>;
}

export type UnauthorizedState = { status: "unauthorized" };
export type AuthorizedState = {
  status: "authorized";
} & AuthorizedUserProperties;
export type AuthState = UnauthorizedState | AuthorizedState;

export function isAuthorizedState(state: AuthState): state is AuthorizedState {
  return state.status === "authorized";
}
