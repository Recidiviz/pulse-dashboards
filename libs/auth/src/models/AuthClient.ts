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

import createAuth0Client, {
  Auth0Client,
  Auth0ClientOptions,
  GetTokenSilentlyOptions,
  User,
} from "@auth0/auth0-spa-js";
import { makeAutoObservable, runInAction, when } from "mobx";
import qs from "qs";
import { NavigateFunction } from "react-router-dom";
import { z } from "zod";

import { isOfflineMode, isTestEnv } from "~client-env-utils";
import {
  castToError,
  Hydratable,
  HydrationState,
  isHydrationFinished,
  isHydrationUntouched,
} from "~hydration-utils";

type Settings<AppMetadata extends z.ZodTypeAny> = {
  metadataNamespace: string;
  metadataSchema: AppMetadata;
};

/**
 * Provides a Mobx-observable integration with the Auth0 SDK, translating async interactions
 * with Auth0 into synchronously observable properties.
 *
 */
export class AuthClient<AppMetadata extends z.ZodTypeAny = z.ZodTypeAny>
  implements Hydratable
{
  /**
   * Only one client should be initialized per session
   */
  private _authClient?: Auth0Client;

  /**
   * Indicates whether the user has successfully authenticated.
   * While not continuously synchronized with the Auth0 session, it should be updated
   * as soon as we detect a change in status
   */
  private isAuthenticated = false;

  /**
   * Indicates whether there is an active loading state (an auth check is still pending).
   * Should only be true during initialization, subsequent auth checks should not cycle this
   */
  private isLoading?: boolean;

  /**
   * Error(s) occurring during auth
   */
  private error?: Error;

  /**
   * Stores information about the logged-in user
   */
  private user?: User;

  constructor(
    private readonly authSettings: Auth0ClientOptions,
    private clientSettings: Settings<AppMetadata>,
  ) {
    makeAutoObservable(this);
  }

  /**
   * Indicates whether the user's email address has been verified.
   * Unverified users must not be granted access to any protected content.
   */
  private get isEmailVerified(): boolean {
    return !!this.user?.email_verified;
  }

  /**
   * Indicates whether the user is generally authorized to access protected content.
   * Some content may require additional permissions beyond basic authorization.
   */
  get isAuthorized(): boolean {
    // for convenience, bypass this in offline and test modes
    if (isOfflineMode() || isTestEnv()) {
      return true;
    }

    return this.isAuthenticated && this.isEmailVerified;
  }

  /**
   * Indicates that the user has logged in successfully but has not yet verified their email.
   * Can only be true if {@link isAuthorized} is false
   */
  get isEmailVerificationRequired(): boolean {
    if (this.isAuthorized) return false;
    return this.isAuthenticated && !this.isEmailVerified;
  }

  /**
   * "Hydration" for this model is defined as:
   * - an Auth0 client has been successfully initialized
   * - Auth0 authentication status has been checked at least once
   */
  get hydrationState(): HydrationState {
    // for convenience, bypass this in offline and test modes
    if (isOfflineMode() || isTestEnv()) {
      return { status: "hydrated" };
    }

    if (this.error) {
      return { status: "failed", error: this.error };
    }

    if (this.isLoading) {
      return { status: "loading" };
    }

    if (!this._authClient) return { status: "needs hydration" };

    return { status: "hydrated" };
  }

  /**
   * Initializes an auth client and immediately checks auth status.
   * Safe to call repeatedly but will be a no-op once hydration is initiated;
   * use {@link updateAuthStatus} for subsequent checks rather than this method
   */
  async hydrate(): Promise<void> {
    if (isHydrationUntouched(this)) {
      this.isLoading = true;
      try {
        if (!this._authClient) {
          const client = await createAuth0Client(this.authSettings);
          runInAction(() => {
            this._authClient = client;
          });
        }
        await this.updateAuthStatus();
      } catch (e) {
        runInAction(() => {
          this.error = castToError(e);
        });
      }
      runInAction(() => {
        this.isLoading = false;
      });
    } else {
      await when(() => isHydrationFinished(this));
    }
  }

  /**
   * Returns the Auth0 client stored on this instance, once it has been created by {@link hydrate}.
   */
  private async authClient(): Promise<Auth0Client> {
    await when(() => !!this._authClient);
    return this._authClient as Auth0Client;
  }

  /**
   * Checks authentication status with Auth0 and updates {@link isAuthenticated}
   * and {@link user} accordingly.
   */
  async updateAuthStatus(): Promise<void> {
    // bypass this in offline and test modes
    if (isOfflineMode() || isTestEnv()) {
      return;
    }

    const auth0 = await this.authClient();
    const isAuthenticated = await auth0.isAuthenticated();

    let user: User | undefined;

    // look up user data if we don't already have it
    if (isAuthenticated && !this.user) {
      user = await auth0.getUser();
    }

    runInAction(() => {
      this.isAuthenticated = isAuthenticated;
      // this will either initialize user data (if we didn't already have it)
      // or clear it (if user is not authorized)
      if ((isAuthenticated && user) || !isAuthenticated) {
        this.user = user;
      }
    });
  }

  /**
   * Redirects to the Auth0 login flow.
   * @param targetPath User's final destination after successful login. Defaults to the current path,
   * pass a different value to override
   */
  async logIn(targetPath?: string): Promise<void> {
    const auth0 = await this.authClient();

    return auth0.loginWithRedirect({
      appState: { targetPath: targetPath ?? window.location.pathname },
    });
  }

  /**
   * Checks auth status, and if the user is not authenticated, immediately triggers the login flow.
   * @param targetPath User's final destination after successful login. Defaults to the current path,
   * pass a different value to override
   */
  async logInIfLoggedOut(targetPath?: string): Promise<void> {
    await this.updateAuthStatus();
    // note that we are only checking authentication, not authorization (which includes email verification).
    // we don't want to trigger an infinite login loop while awaiting email verification
    if (!this.isAuthenticated) {
      await this.logIn(targetPath);
    }
  }

  /**
   * Redirects to Auth0 to clear the session and log the user out.
   * @param returnToPath By default Auth0 will return users to the site root after logout.
   * Pass an alternate path to override
   */
  async logOut(returnToPath = "/"): Promise<void> {
    const auth0 = await this.authClient();

    auth0.logout({
      returnTo: `${window.location.origin}${returnToPath}`,
    });
  }

  /**
   * Gets an Auth0 access token silently, if allowed. If this fails because the user is logged out,
   * updates auth status flags. Also throws on this or any other failure.
   */
  async getTokenSilently(options?: GetTokenSilentlyOptions): Promise<string> {
    const auth0 = await this.authClient();

    try {
      return auth0.getTokenSilently(options);
    } catch (caught) {
      const e = castToError(caught);
      if ("error" in e && e.error === "login_required") {
        this.updateAuthStatus();
      }
      throw new Error(`Unable to retrieve token - ${e}`);
    }
  }

  /**
   * It is important that the post-login redirect is only handled once; use this flag
   * to defend against duplicate calls from UI components.
   */
  private isRedirectHandled = false;

  /**
   * Handles the Auth0 post-login redirect, which includes critical session information
   * in the URL querystring.
   * @param navigate Must be the React Router navigate function provided by `useNavigate()`,
   * or a wrapper around it. The Auth0 query parameters must be cleared, and the user should
   * be redirected to their intended path, and this function will use `navigate` to accomplish this.
   * @param defaultRedirectPath We expect to receive a target path from Auth0 after handling
   * the redirect; if that is missing or the login has failed the user will be redirected to this path instead.
   */
  async handleRedirectFromLogin(
    navigate: NavigateFunction,
    defaultRedirectPath = "/",
  ) {
    if (this.isRedirectHandled) return;

    this.isRedirectHandled = true;

    const urlQuery = qs.parse(window.location.search, {
      ignoreQueryPrefix: true,
    });

    if (urlQuery["error"]) {
      console.error(urlQuery);
      await this.updateAuthStatus();
      throw new Error(`Auth0 error: ${urlQuery["error"]}`);
    }

    // these are the magic query params we expect to get from Auth0;
    // the callback will fail if they are missing
    if (!(urlQuery["code"] && urlQuery["state"])) {
      throw new Error(
        "Cannot handle redirect from Auth0, missing code and state URL params",
      );
    }

    const auth0 = await this.authClient();

    const { appState } = await auth0.handleRedirectCallback();
    await this.updateAuthStatus();

    const replacementPath = appState?.targetPath ?? defaultRedirectPath;
    navigate(replacementPath, { replace: true });
  }

  get appMetadata(): z.infer<AppMetadata> {
    return this.clientSettings.metadataSchema.parse(
      this.user?.[`${this.clientSettings.metadataNamespace}/app_metadata`],
    );
  }
}
