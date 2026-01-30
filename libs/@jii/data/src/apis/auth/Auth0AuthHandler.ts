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
import SuperJSON from "superjson";

import {
  authorizedUserProfileSchema,
  getAuth0Config,
  metadataNamespace,
} from "~@jii/auth";
import type { JiiResidentAppRouter } from "~@jii/trpc-types";
import { AuthClient } from "~auth";
import {
  castToError,
  HydrationState,
  isHydrated,
  isHydrationInProgress,
} from "~hydration-utils";

import { JII_TRPC_BACKEND_PATH } from "../constants";
import { AuthHandler, AuthorizedUserProperties } from "./types";

export class Auth0AuthHandler implements AuthHandler {
  authClient: AuthClient<typeof authorizedUserProfileSchema>;
  firebaseToken?: string;

  constructor() {
    makeAutoObservable(this, { authClient: false });

    const config = getAuth0Config(import.meta.env["VITE_AUTH_ENV"]);
    this.authClient = new AuthClient(
      {
        domain: config.domain,
        clientId: config.client_id,
        useFormData: false,
        authorizationParams: {
          redirect_uri: `${window.location.origin}/after-login`,
          audience: config.audience,
        },
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
    // this client can only call the auth0 flow endpoint(s) with this configuration
    const client = createTRPCClient<JiiResidentAppRouter>({
      links: [
        httpLink({
          url: JII_TRPC_BACKEND_PATH,
          headers: async () => {
            return {
              Authorization: `Bearer ${await this.authClient.getTokenSilently()}`,
            };
          },
          transformer: SuperJSON,
        }),
      ],
    });

    try {
      const { firebaseToken } = await client.auth.auth0ToFirebaseToken.query();

      runInAction(() => {
        this.firebaseToken = firebaseToken;
      });
    } catch {
      throw new Error("Unable to retrieve Firebase token");
    }
  }
}
