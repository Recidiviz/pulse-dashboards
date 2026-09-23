// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeAutoObservable, runInAction } from "mobx";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import { ParoleCase, ParoleHearing } from "~datatypes";

import { ParoleConfig } from "../core/models/types";
import { RootStore } from "../RootStore";
import { resetOnTenantOrUserChange } from "../RootStore/resetOnTenantOrUserChange";
import { ParoleAPI } from "./api/interface";
import { isSupportedTenantId, ParoleAPIClient } from "./api/ParoleAPIClient";
import { ParoleOfflineAPIClient } from "./api/ParoleOfflineAPIClient";

export class ParoleStore {
  hearings?: Array<ParoleHearing>;
  caseDetailsByDocId = new Map<string, ParoleCase>();

  constructor(public rootStore: RootStore) {
    makeAutoObservable(this);
    resetOnTenantOrUserChange(this.rootStore, () => this.clearCaches());
  }

  /**
   * Bumped every time the caches are cleared. A fetch captures this before it
   * awaits and re-checks it after, so a response for the previous tenant or
   * user is never written into the caches the current one reads from.
   */
  private cacheGeneration = 0;

  private clearCaches(): void {
    this.hearings = undefined;
    this.caseDetailsByDocId.clear();
    this.cacheGeneration += 1;
  }

  /**
   * Fetches the docket hearings for the current tenant, unless an earlier
   * fetch already cached them. A cached empty docket still counts as cached.
   */
  async populateHearings(): Promise<void> {
    if (this.hearings !== undefined) return;

    const generation = this.cacheGeneration;
    const hearings = await this.apiClient.hearings();
    if (generation !== this.cacheGeneration) {
      return this.populateHearings();
    }

    runInAction(() => {
      this.hearings = hearings;
    });
  }

  /**
   * Fetches one case profile by DOC id, unless an earlier fetch already
   * cached it.
   *
   * @param docId - The DOC id of the case to fetch.
   */
  async populateCaseDetail(docId: string): Promise<void> {
    if (this.caseDetailsByDocId.has(docId)) return;

    const generation = this.cacheGeneration;
    const caseDetail = await this.apiClient.caseDetail(docId);
    if (generation !== this.cacheGeneration) {
      // See populateHearings. A DOC id identifies a different person in
      // another state, so a stale write here would mask a real case profile.
      return this.populateCaseDetail(docId);
    }

    runInAction(() => {
      this.caseDetailsByDocId.set(docId, caseDetail);
    });
  }

  get apiClient(): ParoleAPI {
    const { currentTenantId } = this.rootStore.tenantStore;
    const hasRealData =
      isSupportedTenantId(currentTenantId) && !isOfflineMode() && !isDemoMode();
    return hasRealData
      ? new ParoleAPIClient(this)
      : new ParoleOfflineAPIClient(this);
  }

  get config(): ParoleConfig {
    const { currentTenantId, currentTenantConfig } = this.rootStore.tenantStore;
    if (!currentTenantConfig) {
      throw new Error(
        "ParoleStore.config accessed with no current tenant configured",
      );
    }
    if (!currentTenantConfig.paroleConfig) {
      throw new Error(
        `Tenant [${currentTenantId}] has no paroleConfig set. Add one in ` +
          `tenants/<STATE>.ts to enable the Parole board for this tenant.`,
      );
    }
    return currentTenantConfig.paroleConfig;
  }
}
