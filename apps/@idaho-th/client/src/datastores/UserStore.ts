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
import { makeAutoObservable, runInAction } from "mobx";
import qs from "qs";

import { getIdahoThRuntimeConfig } from "~@idaho-th/client/runtimeConfig";
import {
  AUTH0_ROLE_QUERY_PARAM,
  getAuth0ConnectionForFlow,
  getAuth0RoleForFlow,
  type SignInFlow,
  UserRole,
} from "~@idaho-th/shared";
import { castToError } from "~hydration-utils";

import { hasPriorAuth0Session } from "../auth0/hasPriorAuth0Session";
import { safeSessionStorage } from "../auth0/safeSessionStorage";

export type AuthenticatedUser = User & {
  role?: UserRole;
  providerPseudonymizedId?: string;
};

export type AuthorizeOptions = {
  redirectIfUnauthenticated?: boolean;
};

const RECOVERY_ATTEMPTED_STORAGE_KEY = "auth0.recoveryAttempted";

export class UserStore {
  authError?: Error;

  auth0?: Auth0Client;

  isAuthorized: boolean;

  userIsLoading: boolean;

  user?: AuthenticatedUser;

  getToken?: (
    options?: GetTokenSilentlyOptions,
  ) => Promise<string | undefined> | undefined;

  logout?: (options?: LogoutOptions) => void;

  constructor(readonly authSettings: Auth0ClientOptions) {
    makeAutoObservable(this, {
      authSettings: false,
    });

    this.isAuthorized = false;
    this.userIsLoading = true;
  }

  /**
   * Initiates the Auth0 authentication flow.
   * If the user already has a valid session, retrieves credentials silently.
   * Otherwise redirects to Auth0 login.
   */
  async authorize(
    handleTargetUrl: (targetUrl: string) => void,
    options: AuthorizeOptions = {},
  ): Promise<void> {
    const { redirectIfUnauthenticated = true } = options;

    try {
      let auth0 = this.auth0;
      if (!auth0) {
        auth0 = await createAuth0Client(this.authSettings);
        runInAction(() => {
          this.auth0 = auth0;
        });
      }

      const urlQuery = qs.parse(window.location.search, {
        ignoreQueryPrefix: true,
      });

      if (urlQuery["error"]) {
        window.history.replaceState(
          {},
          document.title,
          `${window.location.origin}${window.location.pathname}`,
        );
        const errorCode = urlQuery["error"];
        if (
          errorCode === "login_required" ||
          errorCode === "interaction_required"
        ) {
          try {
            await auth0.logout({ openUrl: false });
          } catch {
            // Local cleanup failed; the stale cookie just persists longer.
          }
          runInAction(() => {
            this.isAuthorized = false;
            this.userIsLoading = false;
          });
          return;
        }
        throw new Error("Authentication failed. Please try again.");
      }

      if (urlQuery["code"] && urlQuery["state"]) {
        const { appState } = await auth0.handleRedirectCallback();
        // Auth0 params are single-use; must be removed from history
        const replacementUrl =
          appState?.targetUrl ??
          `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, document.title, replacementUrl);
        handleTargetUrl(replacementUrl);
      }

      if (await auth0.isAuthenticated()) {
        const user = await auth0.getUser();
        if (user) {
          this.setAuthenticatedUser(user);
        } else {
          runInAction(() => {
            this.isAuthorized = false;
            this.userIsLoading = false;
            this.authError = new Error(
              "Authentication failed. Please try again.",
            );
          });
        }
      } else {
        const priorAuth0Session = hasPriorAuth0Session(
          this.authSettings.clientId,
        );
        const recoveryAlreadyAttempted = Boolean(
          safeSessionStorage.get(RECOVERY_ATTEMPTED_STORAGE_KEY),
        );

        if (redirectIfUnauthenticated) {
          if (priorAuth0Session) {
            safeSessionStorage.set(RECOVERY_ATTEMPTED_STORAGE_KEY, "true");
          }
          await auth0.loginWithRedirect({
            appState: { targetUrl: window.location.href },
          });
          return;
        }

        if (!recoveryAlreadyAttempted && priorAuth0Session) {
          safeSessionStorage.set(RECOVERY_ATTEMPTED_STORAGE_KEY, "true");

          await auth0.loginWithRedirect({
            appState: { targetUrl: window.location.href },
            authorizationParams: { prompt: "none" },
          });
          return;
        }

        if (priorAuth0Session) {
          try {
            await auth0.logout({ openUrl: false });
          } catch {
            // Local cleanup failed; the stale cookie just persists longer.
          }
        }
        runInAction(() => {
          this.isAuthorized = false;
          this.userIsLoading = false;
        });
      }
    } catch (caught) {
      const error = castToError(caught);
      if (error.message === "Invalid state" && this.auth0) {
        try {
          await this.auth0.logout({ openUrl: false });
        } catch {
          // Local cleanup failed; fall through and still stop loading below.
        }
        runInAction(() => {
          this.isAuthorized = false;
          this.userIsLoading = false;
        });
        return;
      }
      runInAction(() => {
        this.authError = error;
        this.userIsLoading = false;
      });
    }
  }

  private setAuthenticatedUser(user: AuthenticatedUser): void {
    safeSessionStorage.remove(RECOVERY_ATTEMPTED_STORAGE_KEY);
    runInAction(() => {
      this.user = user;
      this.getToken = async (options?: GetTokenSilentlyOptions) => {
        try {
          return await this.auth0?.getTokenSilently(options);
        } catch (caught) {
          const error = castToError(caught);
          if ((error as { error?: string }).error === "login_required") {
            await this.auth0?.loginWithRedirect({
              appState: { targetUrl: window.location.href },
            });
            return undefined;
          }
          throw error;
        }
      };
      this.logout = (options?: LogoutOptions) => this.auth0?.logout(options);
      this.isAuthorized = true;
      this.userIsLoading = false;
    });
  }

  async endSession(): Promise<void> {
    try {
      await this.auth0?.logout({ openUrl: false });
    } catch {
      // Logout failed; re-read session state from Auth0 instead of forcing logout.
    }

    if (this.auth0 && (await this.auth0.isAuthenticated())) {
      const user = await this.auth0.getUser();
      if (user) {
        runInAction(() => {
          this.user = user;
          this.getToken = (options?: GetTokenSilentlyOptions) =>
            this.auth0?.getTokenSilently(options);
          this.logout = (options?: LogoutOptions) =>
            this.auth0?.logout(options);
          this.isAuthorized = true;
          this.userIsLoading = false;
        });
        return;
      }
    }

    runInAction(() => {
      this.isAuthorized = false;
      this.user = undefined;
      this.getToken = undefined;
      this.logout = undefined;
      this.userIsLoading = false;
    });
  }

  redirectToLogin(): void {
    if (window.location.pathname !== "/login") {
      window.location.replace(`${window.location.origin}/login`);
    }
  }

  async expireSession(): Promise<void> {
    if (this.auth0) {
      await this.endSession();
    } else {
      runInAction(() => {
        this.isAuthorized = false;
        this.user = undefined;
        this.getToken = undefined;
        this.logout = undefined;
        this.userIsLoading = false;
      });
    }

    if (!this.isAuthorized) {
      this.redirectToLogin();
    }
  }

  async getTokenSilently(
    options?: GetTokenSilentlyOptions,
  ): Promise<string | undefined> {
    if (!this.getToken) return undefined;

    try {
      return await this.getToken(options);
    } catch {
      await this.expireSession();
      return undefined;
    }
  }

  async loginWithRedirect(): Promise<void> {
    await this.auth0?.loginWithRedirect({
      appState: { targetUrl: window.location.href },
    });
  }

  /**
   * Starts Auth0 login for the given email using the sign-in flow the backend
   * resolved in `checkSignInEmail`. The client does not classify emails itself:
   * the production staff allowlist lives in Secret Manager and must never ship
   * in the bundle.
   */
  async loginWithEmail(email: string, flow: SignInFlow): Promise<void> {
    const trimmed = email.trim();
    const isProduction = getIdahoThRuntimeConfig().appEnv === "production";
    const connection = getAuth0ConnectionForFlow(flow, isProduction);
    const role = getAuth0RoleForFlow(flow);

    if (!this.auth0) {
      const auth0 = await createAuth0Client(this.authSettings);
      runInAction(() => {
        this.auth0 = auth0;
      });
    }

    await this.auth0?.loginWithRedirect({
      appState: { targetUrl: `${window.location.origin}/` },
      authorizationParams: {
        connection,
        login_hint: trimmed,
        ...(role ? { [AUTH0_ROLE_QUERY_PARAM]: role } : {}),
      },
    });
  }

  setAuthError(error: Error): void {
    this.authError = error;
  }
}
