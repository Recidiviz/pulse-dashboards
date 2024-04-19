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
import { AuthStore } from "@recidiviz/auth";

import { isOfflineMode, isTestEnv } from "~client-env-utils";

import { DataAPI } from "../api/interface";
import { OfflineAPIClient } from "../api/OfflineAPIClient";
import { ResidentsStore } from "./ResidentsStore";
import { UserStore } from "./UserStore";

export class RootStore {
  /**
   * Will be an offline client in offline and test modes,
   * and an external API client otherwise.
   */
  apiClient: DataAPI;

  authStore: AuthStore;

  residentsStore: ResidentsStore;

  userStore: UserStore;

  // for convenience, this is a constant while we only have one state onboarded
  readonly stateCode = "US_ME";

  constructor() {
    this.authStore = new AuthStore({
      authSettings: {
        client_id: import.meta.env["VITE_AUTH0_CLIENT_ID"],
        domain: import.meta.env["VITE_AUTH0_DOMAIN"],
        redirect_uri: `${window.location.origin}`,
      },
    });

    this.apiClient = this.createApiClient();

    this.residentsStore = new ResidentsStore(this);

    this.userStore = new UserStore();
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
      // TODO(#5116): implement online mode
      return new OfflineAPIClient(this);
    }
  }
}
