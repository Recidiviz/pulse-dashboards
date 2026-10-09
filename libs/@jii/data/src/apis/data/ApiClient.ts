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

import type { TRPCClient } from "@trpc/client";
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { makeObservable } from "mobx";
import { ILazyObservable, lazyObservable } from "mobx-utils";

import { residentsConfigByState, StateCode } from "~@jii/configs";
import type { JiiResidentAppRouter } from "~@jii/trpc-types";
import { FirebaseAuthClient } from "~firebase-auth";

import { AuthManager } from "../auth/AuthManager";
import { queryClient } from "../query/client";
import { DataAPI } from "./interface";
import { createTrpcClientForApi } from "./trpcMixin";

export class ApiClient implements DataAPI {
  readonly trpc: TRPCClient<JiiResidentAppRouter>;
  readonly trpcQuerier: TRPCOptionsProxy<JiiResidentAppRouter>;

  private authentication: ILazyObservable<boolean>;

  constructor(
    private externals: {
      authManager: AuthManager;
      firebaseAuthClient: FirebaseAuthClient;
    },
  ) {
    makeObservable<this, "isAuthenticated">(this, { isAuthenticated: true });

    this.trpc = createTrpcClientForApi(this);
    this.trpcQuerier = createTRPCOptionsProxy({
      client: this.trpc,
      queryClient,
    });

    // this function will only run the first time auth is checked
    this.authentication = lazyObservable(async (updateValue) => {
      // note that we are assuming the auth flow is already complete by the time this is called,
      // otherwise this would result in an error being thrown
      const firebaseToken = await this.externals.authManager.getFirebaseToken();

      await this.externals.firebaseAuthClient.authenticate(firebaseToken);
      updateValue(true);
    }, false);
  }

  getApiToken(): Promise<string> {
    return this.externals.firebaseAuthClient.getIdToken();
  }

  get isAuthenticated() {
    return this.authentication.current();
  }

  /**
   * Fetches application config object for the landing page (pre-login)
   */
  async landingPageConfig() {
    const { landingPageConfig } = await import(
      "../../configs/landingPageConfig"
    );
    return landingPageConfig;
  }

  /**
   * Fetches residents config object matching state code from {@link externals}.
   * This comes from a local static file, not an API backend
   */
  async residentsConfig(stateCode: StateCode) {
    return residentsConfigByState[stateCode];
  }
}
