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

import { type TRPCClient } from "@trpc/client";
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";

import { residentsConfigByState, StateCode } from "~@jii/configs";
import type { JiiResidentAppRouter } from "~@jii/trpc-types";

import { AuthManager } from "../auth/AuthManager";
import { queryClient } from "../query/client";
import { DataAPI } from "./interface";
import { createTrpcClientForApi } from "./trpcMixin";

export class OfflineAPIClient implements DataAPI {
  isAuthenticated = true;

  readonly trpc: TRPCClient<JiiResidentAppRouter>;
  readonly trpcQuerier: TRPCOptionsProxy<JiiResidentAppRouter>;

  constructor(private externals: { authManager: AuthManager }) {
    this.trpc = createTrpcClientForApi(this);
    this.trpcQuerier = createTRPCOptionsProxy({
      client: this.trpc,
      queryClient,
    });
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
   * Fetches residents config object matching `stateCode`
   */
  async residentsConfig(stateCode: StateCode) {
    return residentsConfigByState[stateCode];
  }

  getApiToken() {
    // we don't communicate with Firebase in offline mode, but the auth manager
    // will give us a valid dummy token that will work offline
    return this.externals.authManager.getFirebaseToken();
  }
}
