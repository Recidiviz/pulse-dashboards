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

import { isDemoMode, isOfflineMode, isTestEnv } from "~client-env-utils";
import { FlowMethod, Hydratable, HydratesFromSource } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import { OPPORTUNITY_CONFIGS } from "..";
import { OpportunityType } from "../OpportunityType/types";
import { OpportunityConfigurationAPI } from "./api/interface";
import { OpportunityConfigurationAPIClient } from "./api/OpportunityConfigurationAPIClient";
import { OpportunityConfigurationOfflineAPIClient } from "./api/OpportunityConfigurationOfflineAPIClient";
import {
  IApiOpportunityConfiguration,
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

  constructor(public rootStore: RootStore) {
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
        new LocalOpportunityConfiguration(rawConfig, this.rootStore.userStore),
    );

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

  *populateApiOpportunityConfigurations(): FlowMethod<
    OpportunityConfigurationAPI["opportunities"],
    void
  > {
    if (
      !this.rootStore.userStore.activeFeatureVariants
        .opportunityConfigurationAPI
    ) {
      this.apiOpportunityConfigurations = {};
      return;
    }

    const rawConfigs = yield this.apiClient.opportunities();

    this.apiOpportunityConfigurations = mapValues(
      rawConfigs,
      (rawConfig) =>
        new ApiOpportunityConfiguration(
          rawConfig as IApiOpportunityConfiguration,
          this.rootStore.userStore,
        ),
    );
  }

  get opportunities() {
    if (
      this.rootStore.userStore.activeFeatureVariants.opportunityConfigurationAPI
    ) {
      // This assertion is temporary: we'll never instantiate an opportunity
      // that doesn't have a config, but there are a lot of places which assume
      // the existance of a config for all OpportunityTypes
      return (this.apiOpportunityConfigurations ?? {}) as Record<
        OpportunityType,
        OpportunityConfiguration
      >;
    } else {
      return this.localOpportunityConfigurations;
    }
  }

  get enabledOpportunityTypes() {
    return Object.entries(this.opportunities)
      .filter(([opportunityType, opportunity]) => opportunity.isEnabled)
      .map(
        ([opportunityType, opportunity]) => opportunityType as OpportunityType,
      );
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
