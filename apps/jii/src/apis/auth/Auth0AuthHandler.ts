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

import { makeAutoObservable, runInAction } from "mobx";

import { AuthClient } from "~auth";
import {
  authorizedUserProfileSchema,
  getAuth0Config,
  metadataNamespace,
} from "~auth0-jii";
import {
  castToError,
  HydrationState,
  isHydrated,
  isHydrationInProgress,
} from "~hydration-utils";

import { API_URL_BASE } from "./constants";
import { AuthHandler, AuthorizedUserProperties } from "./types";

export class Auth0AuthHandler implements AuthHandler {
  authClient: AuthClient<typeof authorizedUserProfileSchema>;
  firebaseToken?: string;

  constructor() {
    makeAutoObservable(this, { authClient: false });

    this.authClient = new AuthClient(
      {
        ...getAuth0Config(import.meta.env["VITE_AUTH_ENV"]),
        redirect_uri: `${window.location.origin}/after-login`,
      },
      { metadataNamespace, metadataSchema: authorizedUserProfileSchema },
    );
  }

  get userProfile(): AuthorizedUserProperties["userProfile"] | undefined {
    try {
      return {
        ...this.authClient.appMetadata,
        name: this.authClient.userProperties?.name,
      };
    } catch {
      return;
    }
  }

  private hydrationStateOverride?: HydrationState;

  get hydrationState() {
    return this.hydrationStateOverride ?? this.authClient.hydrationState;
  }

  async hydrate() {
    if (isHydrated(this) || isHydrationInProgress(this)) return;

    this.hydrationStateOverride = { status: "loading" };

    try {
      await this.authClient.hydrate();

      runInAction(() => {
        this.hydrationStateOverride = undefined;
      });
    } catch (e) {
      runInAction(() => {
        this.hydrationStateOverride = {
          status: "failed",
          error: castToError(e),
        };
      });
    }
  }

  async getFirebaseToken() {
    if (!this.firebaseToken) {
      await this.authClient.checkForAuthentication();
      await this.exchangeAuth0Token();
    }
    // safe to assert because the preceding call would have failed otherwise
    return this.firebaseToken as string;
  }

  private async exchangeAuth0Token() {
    const response = await fetch(`${API_URL_BASE}/auth/auth0`, {
      headers: {
        Authorization: `Bearer ${await this.authClient.getTokenSilently()}`,
      },
    });

    if (response.ok) {
      const firebaseToken = (await response.json()).firebaseToken;
      runInAction(() => {
        this.firebaseToken = firebaseToken;
      });
    } else {
      throw new Error("Unable to retrieve Firebase token");
    }
  }
}
