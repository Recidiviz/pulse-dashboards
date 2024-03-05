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

import { apiOpportunityConfigurationResponseSchema } from "../dtos/ApiOpportunityConfigurationResponseSchema";
import { OpportunityConfigurationStore } from "../OpportunityConfigurationStore";
import { OpportunityConfigurationAPI } from "./interface";

export class OpportunityConfigurationAPIClient
  implements OpportunityConfigurationAPI
{
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public readonly opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {}

  private get apiStore() {
    return this.opportunityConfigurationStore.rootStore.apiStore;
  }

  private get baseUrl() {
    return `${process.env.REACT_APP_NEW_BACKEND_API_URL}/workflows/${this.tenantId}`;
  }

  get tenantId(): string {
    const { currentTenantId } = this.opportunityConfigurationStore.rootStore;
    if (!currentTenantId) {
      throw new Error(`Attempted to fetch data with undefined tenantId`);
    }
    return currentTenantId;
  }

  async opportunities() {
    const endpoint = `${this.baseUrl}/opportunities`;
    const fetchedData = await this.apiStore.get(endpoint);
    return apiOpportunityConfigurationResponseSchema.parse(fetchedData)
      .enabledConfigs;
  }
}
