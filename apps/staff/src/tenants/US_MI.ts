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

import { TenantConfig } from "../core/models/types";
import { INSIGHTS_PAGES } from "../core/views";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";
import { filterByUserDistrict } from "../WorkflowsStore/utils";

const US_MI_CONFIG: TenantConfig<"US_MI"> = {
  name: "Michigan",
  stateCode: "MI",
  domain: "michigan.gov",
  availableStateCodes: [dashboard.US_MI],
  enableUserRestrictions: false,
  workflowsStaffFilterFn: filterByUserDistrict,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsSystemConfigs: {
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "agent",
        },
      ],
    },
    INCARCERATION: {
      search: [
        {
          searchType: "LOCATION",
          searchField: ["facilityId"],
          searchTitle: "facility",
        },
      ],
    },
  },
  insightsLanternState: true,
  navigation: {
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "clients", "residents"],
  },
  featureVariants: {
    outcomesModule: {},
  },
};

export default US_MI_CONFIG;
