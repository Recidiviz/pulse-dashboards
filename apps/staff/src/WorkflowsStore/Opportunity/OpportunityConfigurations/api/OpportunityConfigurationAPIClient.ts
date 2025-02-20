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

import { TenantId } from "../../../../RootStore/types";
import { apiOpportunityConfigurationResponseSchema } from "../dtos/ApiOpportunityConfigurationSchema";
import { ApiOpportunityConfigurationResponse } from "../interfaces";
import { OpportunityConfigurationStore } from "../OpportunityConfigurationStore";
import { OpportunityConfigurationAPI } from "./interface";

export class OpportunityConfigurationAPIClient
  implements OpportunityConfigurationAPI
{
  constructor(
    public readonly opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {}

  private get apiStore() {
    return this.opportunityConfigurationStore.rootStore.apiStore;
  }

  get tenantId(): TenantId {
    const { currentTenantId } = this.opportunityConfigurationStore.rootStore;
    if (!currentTenantId) {
      throw new Error(`Attempted to fetch data with undefined tenantId`);
    }
    return currentTenantId;
  }

  async fetchForTenantId(
    tenantId: TenantId,
  ): Promise<ApiOpportunityConfigurationResponse> {
    let endpoint = `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/${tenantId}/opportunities`;
    const { isImpersonating, isRecidivizUser } =
      this.opportunityConfigurationStore.rootStore.userStore;
    if (isRecidivizUser || isImpersonating) {
      const featureVariantsParam = Object.keys(
        this.opportunityConfigurationStore.rootStore.userStore
          .activeFeatureVariants,
      ).join(",");
      endpoint += `?featureVariants=${featureVariantsParam}`;
    }
    try {
      // this await isn't redundant, because without it we don't catch the error
      return await this.apiStore.get(endpoint);
    } catch (e) {
      // This isn't optimal error handling, but the backend sends a 401
      // for non-workflows enabled states, and apiStore doesn't throw a
      // machine-readable exception
      console.error(e);
      return { enabledConfigs: {} };
    }
  }

  async opportunities() {
    const fetchedData = await this.fetchForTenantId(this.tenantId);

    return apiOpportunityConfigurationResponseSchema.parse(fetchedData)
      .enabledConfigs;
  }
}
