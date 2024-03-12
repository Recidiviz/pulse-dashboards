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

import { mapValues } from "lodash";
import { flowResult, makeAutoObservable, reaction, runInAction } from "mobx";

import { HydratesFromSource } from "../../../core/models/HydratesFromSource";
import { Hydratable } from "../../../core/models/types";
import { FlowMethod } from "../../../InsightsStore/types";
import { isDemoMode } from "../../../utils/isDemoMode";
import { isOfflineMode } from "../../../utils/isOfflineMode";
import { isTestEnv } from "../../../utils/isTestEnv";
import { WorkflowsStore } from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "..";
import { OpportunityType } from "../OpportunityType/types";
import { OpportunityConfigurationAPI } from "./api/interface";
import { OpportunityConfigurationAPIClient } from "./api/OpportunityConfigurationAPIClient";
import { OpportunityConfigurationOfflineAPIClient } from "./api/OpportunityConfigurationOfflineAPIClient";
import {
  IApiOpportunityConfigurationRaw,
  OpportunityConfiguration,
} from "./interfaces";
import { LocalOpportunityConfiguration } from "./models";
import { ApiOpportunityConfiguration } from "./models/ApiOpportunityConfigurationImpl";
export class OpportunityConfigurationStore implements Hydratable {
  apiClient: OpportunityConfigurationAPI;
  apiOpportunityConfigurations?: Partial<
    Record<OpportunityType, OpportunityConfiguration>
  >;
  localOpportunityConfigurations: Record<
    OpportunityType,
    OpportunityConfiguration
  >;
  hydrator: HydratesFromSource;

  constructor(public workflowsStore: WorkflowsStore) {
    this.apiClient =
      isOfflineMode() || isTestEnv() || isDemoMode()
        ? new OpportunityConfigurationOfflineAPIClient(this)
        : new OpportunityConfigurationAPIClient(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.apiOpportunityConfigurations === undefined)
            throw new Error("failed to populate opportunity configurations");
        },
      ],
      populate: async () => {
        await flowResult(this.populateApiOpportunityConfigurations());
      },
    });

    this.localOpportunityConfigurations = mapValues(
      OPPORTUNITY_CONFIGS,
      (rawConfig) =>
        new LocalOpportunityConfiguration(rawConfig, this.workflowsStore),
    );

    makeAutoObservable(this);

    // reset the store for each new tenant and if the current user changes (such as via impersonation)
    reaction(
      () => {
        return {
          tenant: this.workflowsStore.rootStore.currentTenantId,
          user: this.workflowsStore.rootStore.userStore.user,
        };
      },
      () => {
        runInAction(() => this.reset());
      },
    );
  }

  hydrate() {
    return this.hydrator.hydrate();
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  reset() {
    this.apiOpportunityConfigurations = undefined;
    this.hydrator.setHydrationStateOverride({ status: "needs hydration" });
  }

  get rootStore() {
    return this.workflowsStore.rootStore;
  }

  *populateApiOpportunityConfigurations(): FlowMethod<
    OpportunityConfigurationAPI["opportunities"],
    void
  > {
    if (!this.workflowsStore.featureVariants.opportunityConfigurationAPI) {
      this.apiOpportunityConfigurations = {};
      return;
    }

    const rawConfigs = yield this.apiClient.opportunities();

    this.apiOpportunityConfigurations = mapValues(
      rawConfigs,
      (rawConfig) =>
        new ApiOpportunityConfiguration(
          rawConfig as IApiOpportunityConfigurationRaw,
          this.workflowsStore,
        ),
    );
  }

  get opportunities() {
    return {
      ...this.localOpportunityConfigurations,
      ...this.apiOpportunityConfigurations,
    };
  }

  mockHydrated(apiConfigs: typeof this.apiOpportunityConfigurations = {}) {
    if (!isTestEnv()) {
      throw new Error(
        "Do not call OpportunityConfigurationStore.mockHydrated() outside of tests",
      );
    }

    this.apiOpportunityConfigurations = apiConfigs;
    this.hydrator.setHydrationStateOverride({ status: "hydrated" });
  }
}
