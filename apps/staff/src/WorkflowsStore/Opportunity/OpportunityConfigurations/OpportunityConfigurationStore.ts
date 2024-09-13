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

import { flowResult, makeAutoObservable, reaction, runInAction } from "mobx";

import { isDemoMode, isOfflineMode, isTestEnv } from "~client-env-utils";
import { FlowMethod, Hydratable, HydratesFromSource } from "~hydration-utils";

import { mockOpportunityConfigs } from "../../../core/__tests__/testUtils";
import { downloadZipFile } from "../../../core/Paperwork/utils";
import { RootStore } from "../../../RootStore";
import TENANTS from "../../../tenants";
import { OpportunityType } from "../OpportunityType";
import { OpportunityConfigurationAPI } from "./api/interface";
import { OpportunityConfigurationAPIClient } from "./api/OpportunityConfigurationAPIClient";
import { OpportunityConfigurationOfflineAPIClient } from "./api/OpportunityConfigurationOfflineAPIClient";
import { OpportunityConfiguration } from "./interfaces";
import { apiOpportunityConfigurationFactory } from "./models/CustomOpportunityConfigurations";

type OpportunityConfigurations = Record<
  OpportunityType,
  OpportunityConfiguration
>;

export class OpportunityConfigurationStore implements Hydratable {
  apiClient: OpportunityConfigurationAPI;
  apiOpportunityConfigurations?: OpportunityConfigurations;
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
    const rawConfigs = yield this.apiClient.opportunities();

    this.apiOpportunityConfigurations = Object.fromEntries(
      Object.entries(rawConfigs).map(([oppType, rawConfig]) => [
        oppType,
        apiOpportunityConfigurationFactory(
          oppType as OpportunityType,
          rawConfig,
          this.rootStore.userStore,
        ),
      ]),
    ) as OpportunityConfigurations;
  }

  get opportunities() {
    return (
      this.apiOpportunityConfigurations ?? ({} as OpportunityConfigurations)
    );
  }

  async downloadBlob(throttle_ms = 250) {
    const states = TENANTS.RECIDIVIZ.availableStateCodes.filter(
      (t) => TENANTS[t].navigation?.workflows,
    );
    const files = await Promise.all(
      states.map(async (tenant, i) => {
        await new Promise((resolve) => setTimeout(resolve, throttle_ms * i));
        const fetched = await this.apiClient.fetchForTenantId(tenant);
        return {
          filename: `${tenant}.ts`,
          fileContents: `import { ApiOpportunityConfigurationResponse } from "../../../src/WorkflowsStore/Opportunity/OpportunityConfigurations/interfaces";

export const mockApiOpportunityConfigurationResponse: ApiOpportunityConfigurationResponse = ${JSON.stringify(fetched)}`,
        };
      }),
    );
    files.push({
      filename: "index.ts",
      fileContents: `${states.map((s) => `import * as ${s} from "./${s}";`).join("")}
                      const allConfigs = {
                      ${states.map((s) => `...${s}.mockApiOpportunityConfigurationResponse.enabledConfigs,`).join("")}
                      };
                      export default allConfigs`,
    });
    downloadZipFile("configs.zip", files);
  }

  get enabledOpportunityTypes() {
    return Object.entries(this.opportunities)
      .filter(([opportunityType, opportunity]) => opportunity.isEnabled)
      .map(
        ([opportunityType, opportunity]) => opportunityType as OpportunityType,
      );
  }

  mockHydrated(
    apiConfigs: Record<
      string,
      OpportunityConfiguration
    > = mockOpportunityConfigs,
  ) {
    if (!isTestEnv()) {
      throw new Error(
        "Do not call OpportunityConfigurationStore.mockHydrated() outside of tests",
      );
    }
    this.apiOpportunityConfigurations = apiConfigs as OpportunityConfigurations;
    this.hydrator.setHydrationStateOverride({ status: "hydrated" });
  }

  /**
   * Convert an opportunity's url section to the relevant opportunity type.
   */
  getOpportunityTypeFromUrl(url: string): OpportunityType {
    const { currentTenantId } = this.rootStore;
    const opportunityEntry = Object.entries(this.opportunities).find(
      ([, opportunity]) =>
        opportunity.urlSection === url &&
        opportunity.stateCode === currentTenantId,
    );

    return opportunityEntry?.[0] as OpportunityType;
  }
}
