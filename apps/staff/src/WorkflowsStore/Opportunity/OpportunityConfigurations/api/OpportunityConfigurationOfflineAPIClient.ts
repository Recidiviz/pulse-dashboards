/* eslint-disable class-methods-use-this */
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

export class OpportunityConfigurationOfflineAPIClient
  implements OpportunityConfigurationAPI
{
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public readonly opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {}

  async opportunities() {
    const { mockApiOpportunityConfigurationResponse } = await import(
      "../__mocks__/mockApiOpportunityConfigurationResponse"
    );
    return apiOpportunityConfigurationResponseSchema.parse(
      mockApiOpportunityConfigurationResponse,
    ).enabledConfigs;
  }
}
