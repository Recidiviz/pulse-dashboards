// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  Auth0Client,
  Auth0ClientOptions,
  createAuth0Client,
  GetTokenSilentlyOptions,
  LogoutOptions,
  User,
} from "@auth0/auth0-spa-js";
import { action, makeAutoObservable, runInAction } from "mobx";
import qs from "qs";

import { castToError } from "~hydration-utils";

import type { RootStore } from "./RootStore";

export type UserAppMetadata = {
  stateCode: string;
  pseudonymizedId?: string;
  userHash?: string;
};

// This will likely change to something more formal, and probably to currentTenantId
// once we start pulling over more framework, but this gets us off the ground for now
// TODO (#11618) formalize AllowedStateCode
type AllowedStateCode = "RECIDIVIZ" | "US_NY";

const METADATA_NAMESPACE = import.meta.env[
  "VITE_PUBLIC_PATHWAYS_METADATA_NAMESPACE"
];

// This will likely be moved into a more formal error process but
// it gets us off the ground for now.
const ERROR_MESSAGES = {
  auth0Configuration: "No Auth0 configuration provided",
};

type ConstructorProps = {
  authSettings?: Auth0ClientOptions;
  rootStore?: RootStore;
};

export default class UserStore {
  authError?: Error;

  readonly authSettings?: Auth0ClientOptions;

  auth0?: Auth0Client;

  isAuthorized: boolean;

  userIsLoading: boolean;

  user?: User;

  getToken?: (options?: GetTokenSilentlyOptions) => Promise<string>;

  logout?: (options?: LogoutOptions) => void;

  readonly rootStore?: RootStore;

  constructor({ authSettings, rootStore }: ConstructorProps) {
    makeAutoObservable(this, {
      rootStore: false,
      authSettings: false,
      setAuthError: action.bound,
      getTokenSilently: action.bound,
      loginWithRedirect: action.bound,
    });

    this.authSettings = authSettings;
    this.rootStore = rootStore;

    this.isAuthorized = false;
    this.userIsLoading = true;
  }

  /**
   * If user already has a valid Auth0 credential, this method will retrieve it
   * and update class properties accordingly. If not, user will be redirected
   * to the Auth0 login domain for fresh authentication.
   * Returns an Error if Auth0 configuration is not present.
   */
  async authorize(handleTargetUrl: (targetUrl: string) => void): Promise<void> {
    if (!this.authSettings) {
      this.setAuthError(new Error(ERROR_MESSAGES.auth0Configuration));
      return;
    }

    try {
      const auth0 = await createAuth0Client(this.authSettings);
      this.auth0 = auth0;
      const urlQuery = qs.parse(window.location.search, {
        ignoreQueryPrefix: true,
      });
      if (urlQuery["error"]) {
        throw new Error(`${urlQuery["error_description"]}` as string);
      }
      if (urlQuery["code"] && urlQuery["state"]) {
        const { appState } = await auth0.handleRedirectCallback();
        // auth0 params are single-use, must be removed from history or they can cause errors
        let replacementUrl;
        if (appState && appState.targetUrl) {
          replacementUrl = appState.targetUrl;
        } else {
          // strip away all query params just to be safe
          replacementUrl = `${window.location.origin}${window.location.pathname}`;
        }
        window.history.replaceState({}, document.title, replacementUrl);
        handleTargetUrl(replacementUrl);
      }
      if (await auth0.isAuthenticated()) {
        const user = await auth0.getUser();
        if (user) {
          runInAction(() => {
            this.user = user;
            this.getToken = (options?: GetTokenSilentlyOptions) =>
              auth0.getTokenSilently(options);
            this.logout = (options?: LogoutOptions) => auth0.logout(options);
            this.isAuthorized = true;
            this.userIsLoading = false;
          });
        } else {
          runInAction(() => {
            this.isAuthorized = false;
            this.userIsLoading = false;
          });
        }
      } else {
        this.loginWithRedirect();
      }
    } catch (caught) {
      const error = castToError(caught);
      if (error.message === "Invalid state" && this.auth0) {
        this.auth0.logout();
        this.loginWithRedirect();
      } else {
        this.setAuthError(error);
      }
    }
  }

  setAuthError(error: Error): void {
    runInAction(() => {
      this.userIsLoading = false;
      this.isAuthorized = false;
      this.authError = error;
    });
  }

  /**
   * Returns the Auth0 app_metadata for the given user id token.
   */
  get userAppMetadata(): UserAppMetadata | undefined {
    if (!this.user) return undefined;
    const appMetadataKey = `${METADATA_NAMESPACE}app_metadata`;
    const appMetadata = this.user[appMetadataKey];
    if (!appMetadata) {
      throw Error("No app_metadata available for user");
    }
    return appMetadata;
  }

  async loginWithRedirect(): Promise<void> {
    return this.auth0?.loginWithRedirect({
      appState: { targetUrl: window.location.href },
    });
  }

  /**
   * Returns the state code of the authorized state for the given user.
   * For Recidiviz users or users in demo mode, this will be 'RECIDIVIZ'.
   */
  get stateCode(): AllowedStateCode {
    const stateCode = this.userAppMetadata?.stateCode?.toUpperCase();
    if (!stateCode) {
      throw Error("No state code set for user");
    }
    if (!["RECIDIVIZ", "US_NY"].includes(stateCode)) {
      throw new Error(`Invalid state code for user ${stateCode}`);
    }
    return stateCode as AllowedStateCode;
  }

  get isRecidivizUser(): boolean {
    return this.stateCode === "RECIDIVIZ";
  }

  async getTokenSilently(): Promise<string | undefined> {
    if (!this.getToken || !this.logout) return;

    try {
      return await this.getToken();
    } catch {
      this.loginWithRedirect();
      return undefined;
    }
  }
}
