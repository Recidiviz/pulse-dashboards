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

import { makeAutoObservable, reaction, runInAction } from "mobx";

import { FirestoreAPI, FirestoreOfflineAPIClient } from "~firestore-api";

import { RootStore } from "../RootStore";
import { WorkflowsOfficersStore } from "./WorkflowsOfficersStore";

/**
 * Modular version of a store for Workflows, which contains references to stores for more
 * fine-grained types of data in Workflows.
 */
export class WorkflowsRootStore {
  apiClient: FirestoreAPI;

  workflowsOfficersStore?: WorkflowsOfficersStore;

  constructor(public rootStore: RootStore) {
    this.apiClient = this.getApiClient();

    makeAutoObservable(this);

    // reset the store for each new tenant and if the current user changes (such as via impersonation)
    reaction(
      () => {
        return {
          tenant: this.rootStore.currentTenantId,
          user: this.rootStore.userStore.user,
        };
      },
      () => {
        runInAction(() => this.reset());
      },
    );
  }

  private reset() {
    this.workflowsOfficersStore = undefined;
  }

  private getApiClient(): FirestoreAPI {
    if (!this.rootStore.currentTenantId) {
      throw new Error("Tenant must be set");
    }
    // TODO(#5322): Uncomment
    // return isOfflineMode() || isTestEnv() || isDemoMode()
    //   ? new FirestoreOfflineAPIClient(this.rootStore.currentTenantId)
    //   : new FirestoreAPIClient(this.rootStore.currentTenantId);
    return new FirestoreOfflineAPIClient(this.rootStore.currentTenantId);
  }

  /**
   * Creates this.workflowsOfficersStore for the current tenant, if it does not already exist.
   */
  populateWorkflowsOfficersStore(): void {
    if (this.workflowsOfficersStore) return;

    this.workflowsOfficersStore = new WorkflowsOfficersStore(this);
  }
}
