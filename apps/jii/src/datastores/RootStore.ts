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
import { captureException } from "@sentry/react";
import { makeObservable, onReactionError } from "mobx";

import { isOfflineMode, isTestEnv } from "~client-env-utils";
import { FlowMethod } from "~hydration-utils";

import { ApiClient } from "../apis/data/ApiClient";
import { DataAPI } from "../apis/data/interface";
import { OfflineAPIClient } from "../apis/data/OfflineAPIClient";
import { StateCode } from "../configs/types";
import { ResidentsStore } from "./ResidentsStore";
import { UiStore } from "./UiStore";
import { UserStore } from "./UserStore";

// global error handling for Mobx reactions
onReactionError((error) => {
  captureException(error);
});

export class RootStore {
  /**
   * Will be an offline client in offline and test modes,
   * and an external API client otherwise.
   */
  apiClient: DataAPI;

  residentsStore?: ResidentsStore;

  userStore: UserStore;

  uiStore: UiStore;

  // for convenience, this is a constant while we only have one state onboarded
  readonly stateCode: StateCode = "US_ME";

  constructor() {
    makeObservable(this, {
      populateResidentsStore: true,
      residentsStore: true,
    });

    this.userStore = new UserStore(this);

    this.uiStore = new UiStore();

    this.apiClient = this.createApiClient();
  }

  /**
   * Constructs and returns an appropriate API client based on the environment
   * (e.g. one that returns fixture data in offline mode). Not intended to be
   * MobX-reactive, since it creates a brand-new instance and discards any state
   * the previous instance might have held.
   */
  private createApiClient(): DataAPI {
    if (isOfflineMode() || isTestEnv()) {
      return new OfflineAPIClient(this);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const store = this;
      const externals = {
        // these are getters rather than static properties so that the API client
        // can can observe changes to these values rather than getting a one-time snapshot
        get stateCode() {
          return store.stateCode;
        },
        get authClient() {
          return store.userStore.authClient;
        },
        get config() {
          return store.residentsStore?.config;
        },
      };

      return new ApiClient(externals);
    }
  }

  *populateResidentsStore(): FlowMethod<DataAPI["residentsConfig"], void> {
    const config = yield this.apiClient.residentsConfig();

    this.residentsStore = new ResidentsStore(this, config);
  }
}
