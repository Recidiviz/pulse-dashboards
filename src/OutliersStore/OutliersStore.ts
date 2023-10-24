// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { makeAutoObservable, reaction, runInAction } from "mobx";

import { RootStore } from "../RootStore";
import { isDemoMode } from "../utils/isDemoMode";
import { isOfflineMode } from "../utils/isOfflineMode";
import { isTestEnv } from "../utils/isTestEnv";
import { OutliersAPI } from "./api/interface";
import { OutliersAPIClient } from "./api/OutliersAPIClient";
import { OutliersOfflineAPIClient } from "./api/OutliersOfflineAPIClient";
import { OutliersSupervisionStore } from "./stores/OutliersSupervisionStore";
import { FlowMethod } from "./types";

export class OutliersStore {
  supervisionStore?: OutliersSupervisionStore;

  apiClient: OutliersAPI;

  constructor(public rootStore: RootStore) {
    this.apiClient =
      isOfflineMode() || isTestEnv() || isDemoMode()
        ? new OutliersOfflineAPIClient(this)
        : new OutliersAPIClient(this);

    makeAutoObservable(this);

    // reset the store for each new tenant
    reaction(
      () => this.rootStore.currentTenantId,
      () => {
        runInAction(() => this.reset());
      }
    );
  }

  reset() {
    this.supervisionStore = undefined;
  }

  /**
   * Creates this.supervisionStore for the current tenant, if it does not already exist.
   * This is a MobX flow method and should be called with mobx.flowResult.
   */
  *hydrateSupervisionStore(): FlowMethod<OutliersAPI["init"], void> {
    if (this.supervisionStore) return;

    const config = yield this.apiClient.init();

    this.supervisionStore = new OutliersSupervisionStore(this, config);
  }
}
