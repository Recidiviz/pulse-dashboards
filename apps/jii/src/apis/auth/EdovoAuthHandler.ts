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
import { matchPath } from "react-router-dom";

import { tokenAuthResponseSchema, UserAppMetadata } from "~auth0-jii";
import {
  HydrationState,
  isHydrated,
  isHydrationInProgress,
} from "~hydration-utils";

import { EdovoLandingPage } from "../../routes/routes";
import { API_URL_BASE } from "./constants";
import { AuthHandler } from "./types";

/**
 * This auth handler relies on a token being in the URL. You will not be able to construct
 * an instance of this class on a page that does not have the required URL.
 */
export class EdovoAuthHandler implements AuthHandler {
  userProfile?: UserAppMetadata;

  private firebaseToken?: string;

  private userIdToken: string;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    this.userIdToken = this.tokenFromCurrentUrl();
  }

  private tokenFromCurrentUrl() {
    const urlMatch = matchPath(EdovoLandingPage.path, window.location.pathname);
    if (!urlMatch)
      throw new Error("Edovo token cannot be found in the current URL");

    return EdovoLandingPage.getTypedParams(urlMatch.params).token;
  }

  private hydrationStateOverride?: HydrationState;

  get hydrationState(): HydrationState {
    if (this.hydrationStateOverride) return this.hydrationStateOverride;

    if (this.userProfile && this.firebaseToken) return { status: "hydrated" };

    return { status: "needs hydration" };
  }

  async hydrate() {
    if (isHydrated(this) || isHydrationInProgress(this)) return;

    this.hydrationStateOverride = { status: "loading" };

    const response = await fetch(`${API_URL_BASE}/auth/edovo`, {
      headers: {
        Authorization: `Bearer ${this.userIdToken}`,
      },
    });

    // TODO(#7749): handle error responses, set error override
    if (response.ok) {
      const { firebaseToken, user } = tokenAuthResponseSchema.parse(
        await response.json(),
      );

      runInAction(() => {
        this.firebaseToken = firebaseToken;
        this.userProfile = user;
        this.hydrationStateOverride = undefined;
      });
    }
  }

  async getFirebaseToken() {
    // in practice we do not expect this to be called before the auth flow completes
    if (!this.firebaseToken) {
      throw new Error("Authorization required");
    }

    return this.firebaseToken;
  }
}
