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

import { makeAutoObservable, reaction } from "mobx";

import { RootStore } from "../RootStore";
import { OutliersAPI } from "./api/interface";
import { OutliersOfflineAPIClient } from "./api/OutliersOfflineAPIClient";
import { OutliersSupervisionStore } from "./stores/OutliersSupervisionStore";
import { FlowMethod } from "./types";

export class OutliersStore {
  supervisionStore?: OutliersSupervisionStore;

  apiClient: OutliersAPI;

  constructor(public rootStore: RootStore) {
    this.apiClient = new OutliersOfflineAPIClient(this);

    makeAutoObservable(this);

    // reset the store for each new tenant
    reaction(
      () => this.rootStore.currentTenantId,
      () => {
        this.reset();
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

    const { config } = yield this.apiClient.init();

    this.supervisionStore = new OutliersSupervisionStore(this, config);
  }
}
