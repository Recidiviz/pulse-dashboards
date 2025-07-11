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

import { makeAutoObservable } from "mobx";

import { AuthorizedUserProfile } from "~auth0-jii";
import { isDemoMode as isDemoEnv } from "~client-env-utils";
import { Hydratable, HydrationState, isHydrated } from "~hydration-utils";

import { isEdovoEnv } from "../../utils/edovo";
import { Auth0AuthHandler } from "./Auth0AuthHandler";
import { EdovoAuthHandler } from "./EdovoAuthHandler";
import { AuthHandler, AuthState, isAuthorizedState } from "./types";

export class AuthManager implements Hydratable {
  private readonly handler: AuthHandler;

  constructor() {
    makeAutoObservable<this, "handler">(this, {
      handler: false,
      authClient: false,
    });

    this.handler = isEdovoEnv()
      ? new EdovoAuthHandler()
      : new Auth0AuthHandler();
  }

  /**
   * "Hydration" for this class means that authentication has been attempted at least once.
   * Auth status may still change post-hydration without affecting this value.
   */
  get hydrationState(): HydrationState {
    return this.handler.hydrationState;
  }

  async hydrate() {
    return this.handler.hydrate();
  }

  get authState(): AuthState {
    if (isHydrated(this)) {
      const { userProfile } = this.handler;
      if (userProfile) {
        return { status: "authorized", userProfile };
      }
    }

    return { status: "unauthorized" };
  }

  get isAuthorized() {
    return isAuthorizedState(this.authState);
  }

  get isEmailVerificationRequired() {
    return !!this.handler.authClient?.isEmailVerificationRequired;
  }

  get authClient() {
    return this.handler.authClient;
  }

  /**
   * Returns an API access token that can be used to communicate directly with Firestore.
   * Will throw an error if the current user is not authorized.
   */
  getFirebaseToken() {
    return this.handler.getFirebaseToken();
  }

  get permissions(): AuthorizedUserProfile["permissions"] {
    if ("userProfile" in this.authState) {
      return this.authState.userProfile.permissions;
    }
    return;
  }

  get isDemoUser(): boolean {
    if (isDemoEnv()) return true;
    if (this.permissions) {
      return !this.permissions.includes("live_data");
    }
    return false;
  }
}
