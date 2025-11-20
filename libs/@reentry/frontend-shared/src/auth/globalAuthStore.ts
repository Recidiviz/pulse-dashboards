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

import type { AuthStore } from "@recidiviz/auth";

interface CachedToken {
  token: string;
  tokenExpiresAt: number; // timestamp in milliseconds
  cacheExpiresAt: number;
}

class GlobalAuthStore {
  private authStore: AuthStore | null = null;
  private tokenCache: CachedToken | null = null;
  private readonly tokenExpiryBufferSeconds: number = 30;
  private tokenPromise: Promise<string | null> | null = null;

  setAuthStore(authStore: AuthStore | null) {
    console.warn(`Setting the authStore: ${authStore}`);
    this.authStore = authStore;
    this.tokenCache = null;
    this.tokenPromise = null;
  }

  getAuthStore(): AuthStore | null {
    return this.authStore;
  }

  private ensureAuthStore(): boolean {
    if (!this.authStore) {
      console.warn("No authStore available for token fetch");
      this.redirectToLogin();
      return false;
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private shouldRedirectToLogin(error: any): boolean {
    console.warn(
      `Checking if should redirect to login for error: ${error.error}`,
    );
    const loginRequiredErrors = [
      "login_required",
      "consent_required",
      "interaction_required",
      "invalid_grant",
      "unauthorized",
    ];
    return loginRequiredErrors.includes(error?.error);
  }

  private redirectToLogin() {
    console.warn("Authentication required - redirecting to login");
    this.tokenCache = null;
    this.tokenPromise = null;
    const currentPath = window.location.pathname + window.location.search;
    console.error(`Redirect to ${currentPath}`);
    if (currentPath !== "/") {
      sessionStorage.setItem("auth_redirect", currentPath);
    }
    window.location.href = "/";
  }

  async getCachedToken(): Promise<string | null> {
    if (!this.ensureAuthStore()) {
      return null;
    }

    const now = Date.now();

    if (this.tokenCache && now < this.tokenCache.cacheExpiresAt) {
      // eslint-disable-next-line no-console
      console.debug("Using cached token:", {
        token:
          this.tokenCache.token.length >= 8
            ? `...${this.tokenCache.token.slice(-8)}`
            : this.tokenCache.token,
        tokenExpiresAt: new Date(this.tokenCache.tokenExpiresAt).toISOString(),
        cacheExpiresAt: new Date(this.tokenCache.cacheExpiresAt).toISOString(),
      });
      return this.tokenCache.token;
    }

    if (this.tokenPromise) {
      return await this.tokenPromise;
    }
    // set the tokenPromise to block concurrent calls.
    this.tokenPromise = this.fetchNewToken();

    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchNewToken(): Promise<string | null> {
    if (!this.ensureAuthStore()) {
      return null;
    }

    try {
      // The auth code provided in node_modules/@recidiviz/auth/dist/AuthStore.d.ts
      // Uses  this signatures
      // getTokenSilently(options?: GetTokenSilentlyOptions): Promise<string>;
      // however when provided with a GetTokenSilentlyOptions the results contains more data
      // see https://auth0.github.io/auth0-spa-js/classes/Auth0Client.html#getTokenSilently
      // We use casting as "unknown as required type" as a workaround.
      // the expires_in value is only valid when getting a new token (ignoreCache: true forces that).
      // if getting a current valid token from the local Auth0 cache, the expires_in is not valid since we don't have the time the token was created.
      const options = { ignoreCache: true, detailedResponse: true };
      const result = await this.authStore?.getTokenSilently(options);
      const detailedResponse = result as unknown as {
        access_token: string;
        expires_in: number;
      };

      if (!detailedResponse?.access_token || !detailedResponse?.expires_in) {
        console.error(
          "Invalid token response - missing access_token or expires_in",
        );
        this.redirectToLogin();
        return null;
      }

      const token = detailedResponse.access_token;
      const expires_in = detailedResponse.expires_in; // seconds from token creation time.

      if (!token) {
        console.warn("No token received from authStore");
        this.redirectToLogin();
        return null;
      }

      // we move the expiry time by a buffer amount to avoid using the
      // token close to when it is about to expire.
      const cacheExpiresInMillSec = Math.max(
        0,
        (expires_in - this.tokenExpiryBufferSeconds) * 1000,
      );
      const cacheExpiresAt = Date.now() + cacheExpiresInMillSec;
      const tokenExpiresAt = Date.now() + expires_in * 1000;

      this.tokenCache = {
        token,
        tokenExpiresAt: tokenExpiresAt,
        cacheExpiresAt: cacheExpiresAt,
      };

      // eslint-disable-next-line no-console
      console.debug("Token cached:", {
        token: token.length >= 8 ? `...${token.slice(-8)}` : token,
        expires_in: detailedResponse.expires_in,
        tokenExpiresAt: new Date(tokenExpiresAt).toISOString(),
        cacheExpiresIn: Math.round(cacheExpiresInMillSec / 1000),
        cacheExpiresAt: new Date(cacheExpiresAt).toISOString(),
      });

      return token;
    } catch (error) {
      console.error("Error fetching token:", error);

      if (this.shouldRedirectToLogin(error)) {
        this.redirectToLogin();
      }

      return null;
    }
  }

  async getTokenFromAuth0Cache(): Promise<string | null> {
    if (!this.ensureAuthStore()) {
      return null;
    }

    try {
      return (await this.authStore?.getTokenSilently()) || null;
    } catch (error) {
      console.error("Error fetching token from auth0 cache:", error);
      if (this.shouldRedirectToLogin(error)) {
        this.redirectToLogin();
      }
      return null;
    }
  }
}

export const globalAuthStore = new GlobalAuthStore();
