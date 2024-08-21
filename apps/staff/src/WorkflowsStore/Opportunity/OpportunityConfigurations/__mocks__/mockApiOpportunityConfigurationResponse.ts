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

import { OPPORTUNITY_CONFIGS } from "../../OpportunityConfigs";
import { ApiOpportunityConfigurationResponse } from "../interfaces";

export const mockApiOpportunityConfigurationResponse: ApiOpportunityConfigurationResponse =
  {
    enabledConfigs: Object.fromEntries(
      Object.entries(OPPORTUNITY_CONFIGS).map(([opportunity_type, config]) => [
        opportunity_type,
        {
          ...config,
          displayName: config.label,
          eligibleCriteriaCopy: config.eligibleCriteriaCopy ?? {},
          ineligibleCriteriaCopy: config.ineligibleCriteriaCopy ?? {},
          isAlert: config.isAlert ?? false,
        },
      ]),
    ),
  };
