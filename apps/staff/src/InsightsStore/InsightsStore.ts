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

import { isDemoMode, isOfflineMode, isTestEnv } from "~client-env-utils";
import { normalizeMetricNamesForFixtureData } from "~datatypes";
import { FlowMethod } from "~hydration-utils";

import { downloadZipFile } from "../core/Paperwork/utils";
import { RootStore } from "../RootStore";
import TENANTS from "../tenants";
import { sortObject } from "../WorkflowsStore/utils";
import { InsightsAPIClient } from "./api/InsightsAPIClient";
import { InsightsOfflineAPIClient } from "./api/InsightsOfflineAPIClient";
import { InsightsAPI } from "./api/interface";
import { InsightsSupervisionStore } from "./stores/InsightsSupervisionStore";

export class InsightsStore {
  supervisionStore?: InsightsSupervisionStore;

  apiClient: InsightsAPI;

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

  reset() {
    this.supervisionStore = undefined;
  }

  getApiClient(): InsightsAPI {
    return isOfflineMode() || isTestEnv() || isDemoMode()
      ? new InsightsOfflineAPIClient(this)
      : new InsightsAPIClient(this);
  }

  /**
   * Whether to use the "supervisor homepage" UI. Returns true if the user has the
   * supervisorHomepage feature variant enabled or if the current tenant is not configured as a
   * legacy UI state.
   *
   * This is on InsightsStore and not InsightsSupervisionStore so it can be used pre-hydration.
   */
  get shouldUseSupervisorHomepageUI(): boolean {
    const { userStore, tenantStore } = this.rootStore;
    if (userStore.activeFeatureVariants.supervisorHomepage) return true;

    return !tenantStore.insightsLegacyUI;
  }

  /**
   * Creates this.supervisionStore for the current tenant, if it does not already exist.
   * This is a MobX flow method and should be called with mobx.flowResult.
   */
  *populateSupervisionStore(): FlowMethod<InsightsAPI["init"], void> {
    if (this.supervisionStore) return;

    const config = yield this.apiClient.init();

    this.supervisionStore = new InsightsSupervisionStore(this, config);
  }

  /**
   * Downloads the configurations for each state.
   * These downloaded configs can be manually loaded into the fixtures directory
   * to allow state specific copy/config in offline and demo mode.
   */
  async downloadConfigurations() {
    const states = TENANTS.RECIDIVIZ.availableStateCodes.filter(
      (t) => TENANTS[t].navigation?.insights,
    );

    const fileInputs: { filename: any; fileContents: any }[] = [];
    // Iterate over each state and download its configuration
    for (const stateCode of states) {
      try {
        const data = await this.apiClient.downloadStateConfiguration(stateCode);

        // To keep the size of the fixture data smaller, we don't have metric data for every version of each metric
        // so we will normalize the metric name. The display name will remain the same.
        // ex: incarcerations_starts in place of incarceration_starts_and_inferred
        const normalizedData = {
          ...data,
          metrics: normalizeMetricNamesForFixtureData(data.metrics),
        };

        const formattedData = JSON.stringify(sortObject(normalizedData));

        fileInputs.push({
          filename: `${stateCode}.ts`,
          fileContents: `import { InsightsConfig } from "../schema";

export const ${stateCode.toUpperCase()}: InsightsConfig = ${formattedData};
`,
        });
      } catch (error) {
        console.error(
          `Error downloading or saving data for ${stateCode}:`,
          error,
        );
      }
    }
    downloadZipFile("Insights_configs.zip", fileInputs);
  }
}
