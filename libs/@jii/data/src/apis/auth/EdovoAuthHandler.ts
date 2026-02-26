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

import { createTRPCClient, httpLink } from "@trpc/client";
import { makeAutoObservable, runInAction } from "mobx";
import { matchPath } from "react-router-dom";
import SuperJSON from "superjson";

import { AuthorizedUserProfile } from "~@jii/auth";
import { EdovoLandingPage } from "~@jii/paths";
import type { JiiResidentAppRouter } from "~@jii/trpc-types";
import {
  castToError,
  HydrationState,
  isHydrated,
  isHydrationInProgress,
} from "~hydration-utils";

import { TranslationStore } from "../../datastores/TranslationStore";
import { JII_TRPC_BACKEND_PATH } from "../constants";
import { AuthHandler } from "./types";

/**
 * This auth handler relies on a token being in the URL. You will not be able to construct
 * an instance of this class on a page that does not have the required URL.
 */
export class EdovoAuthHandler implements AuthHandler {
  userProfile?: AuthorizedUserProfile;

  private firebaseToken?: string;

  private userIdToken: string;

  constructor(private translationStore: TranslationStore) {
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

    // this client can only call the Edovo auth flow endpoint(s) with this configuration
    const client = createTRPCClient<JiiResidentAppRouter>({
      links: [
        httpLink({
          url: JII_TRPC_BACKEND_PATH,
          headers: async () => {
            return {
              Authorization: `Bearer ${this.userIdToken}`,
            };
          },
          transformer: SuperJSON,
        }),
      ],
    });

    try {
      const { firebaseToken, user, language } =
        await client.auth.edovoToken.query();

      runInAction(() => {
        this.firebaseToken = firebaseToken;
        this.userProfile = user;
        this.hydrationStateOverride = undefined;
      });

      if (language) {
        this.translationStore.i18n.changeLanguage(language);
      }
    } catch (e) {
      runInAction(() => {
        this.hydrationStateOverride = {
          status: "failed",
          error: castToError(e ?? new Error("Unable to verify your account")),
        };
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
